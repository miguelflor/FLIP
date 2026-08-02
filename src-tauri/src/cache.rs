use crate::utils::decode_latin1;
use chrono::{DateTime, Duration, Utc};
use keyring::Entry;
use rand::RngCore;
use reqwest::Client;
use rusqlite::{params, Connection, OptionalExtension};
use std::error::Error;
use std::fs;
use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

const DB_NAME: &str = "cache.db";
const APP_NAME: &str = "flip";

const CACHE_LIMIT: Duration = Duration::minutes(20);

struct CacheEntry {
    html: String,
    updated_at: DateTime<Utc>,
}

pub struct CacheHandler {
    db: Arc<Mutex<Connection>>,
}

impl CacheHandler {
    pub fn new(conn: Connection) -> Self {
        Self { db: Arc::new(Mutex::new(conn)) }
    }


    async fn put(&self, url: &str, client: &Client) -> Result<String, String> {
        let now = Utc::now();
        let response = client.get(url).send().await.map_err(|e| e.to_string())?;

        if !response.status().is_success() {
            return Err(format!("Failed to scrape {}", url));
        }

        let html_bytes = response.bytes().await.map_err(|e| e.to_string())?;
        let html = decode_latin1(&html_bytes);

        let db = self.db.lock().await;
        let result = db.execute(
            "INSERT INTO html_cache (url, html, updated_at)
             VALUES (?1, ?2, ?3)
             ON CONFLICT(url) DO UPDATE SET
                html = excluded.html,
                updated_at = excluded.updated_at",
            params![url, html, now],
        );

        match result {
            Ok(_) => Ok(html),
            Err(_) => Err(format!("Failed to update cache with {}", url)),
        }
    }

    pub async fn get(&self, url: &str, client: &Client) -> Result<String, String> {
        let result = self
            .db
            .lock()
            .await
            .query_row(
                "SELECT html, updated_at FROM html_cache WHERE url=?1",
                [url],
                |row| {
                    Ok(CacheEntry {
                        html: row.get(0)?,
                        updated_at: row.get(1)?,
                    })
                },
            )
            .optional();

        match result {
            Err(_) => {
                Err(format!("sqlite select for {}", url))
            }
            Ok(None) => {

                let html = self.put(url, client).await?;

                Ok(html)
            }
            Ok(Some(entry)) => {
                let now = Utc::now();
                let elapsed = now - entry.updated_at;

                if elapsed > CACHE_LIMIT {
                    let html = self.put(url, client).await?;
                    return Ok(html);
                }

                Ok(entry.html)
            }
        }
    }
}

pub fn setup_cache(app: &mut tauri::App) -> Result<(), Box<dyn Error>> {
    let data_dir = app.path().app_local_data_dir()?;

    fs::create_dir_all(&data_dir)?;

    let db_path = data_dir.join(DB_NAME);
    let conn = Connection::open(&db_path)?;
    let key = get_or_create_db_key()?;
    conn.pragma_update(None, "key", key)?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS html_cache (url TEXT PRIMARY KEY, html TEXT NOT NULL, updated_at TEXT NOT NULL);",
    )?;

    app.manage(CacheHandler::new(conn));
    Ok(())
}

fn get_or_create_db_key() -> Result<String, Box<dyn Error>> {
    let entry = Entry::new(APP_NAME, "db-encryption-key")?;

    match entry.get_password() {
        Ok(key) => Ok(key),
        Err(_) => {
            let key = generate_random_key();
            entry.set_password(&key)?;
            Ok(key)
        }
    }
}

// Random 32 byte string
fn generate_random_key() -> String {
    let mut bytes = [0u8; 32];
    rand::rng().fill_bytes(&mut bytes);
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

// Tests

#[cfg(test)]
mod tests {
    use super::*;
    use mockito::{Mock, Server};

    fn setup_cache() -> CacheHandler {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS html_cache (url TEXT PRIMARY KEY, html TEXT NOT NULL, updated_at TEXT NOT NULL);",
        ).unwrap();
        CacheHandler::new(conn)
    }

    fn mock_html_endpoint(server: &mut Server, path: &str, body: &str) -> Mock {
        server.mock("GET", path).with_body(body).create()
    }

    #[tokio::test]
    async fn get_inserts_into_cache_on_miss() {
        let mut server = Server::new_async().await;
        let mock = mock_html_endpoint(&mut server, "/page", "<html>hello</html>");

        let cache = setup_cache();
        let client = Client::new();
        let url = format!("{}/page", server.url());

        let result = cache.get(&url, &client).await.unwrap();
        assert_eq!(result, "<html>hello</html>");
        mock.assert();
    }

    #[tokio::test]
    async fn get_returns_cached_html_without_fetching() {
        let mut server = Server::new_async().await;
        let mock = mock_html_endpoint(&mut server, "/page", "<html>first</html>");

        let cache = setup_cache();
        let client = Client::new();
        let url = format!("{}/page", server.url());

        // First call populates cache
        cache.get(&url, &client).await.unwrap();
        mock.assert();

        // Second call should not hit the server
        let mock2 = server.mock("GET", "/page").with_body("second").expect(0).create();
        let result = cache.get(&url, &client).await.unwrap();
        assert_eq!(result, "<html>first</html>");
        mock2.assert();
    }

    #[tokio::test]
    async fn get_refreshes_cache_when_expired() {
        let cache = setup_cache();
        let client = Client::new();

        let mut server = Server::new_async().await;
        let url = format!("{}/page", server.url());

        // Insert a stale entry manually (30 minutes ago)
        let stale_time = Utc::now() - Duration::minutes(30);
        cache.db.lock().await.execute(
            "INSERT INTO html_cache (url, html, updated_at) VALUES (?1, ?2, ?3)",
            params![url, "<html>old</html>", stale_time],
        ).unwrap();

        let mock = mock_html_endpoint(&mut server, "/page", "<html>refreshed</html>");

        let result = cache.get(&url, &client).await.unwrap();
        assert_eq!(result, "<html>refreshed</html>");
        mock.assert();
    }

    #[tokio::test]
    async fn put_returns_error_on_http_failure() {
        let mut server = Server::new_async().await;
        let mock = server.mock("GET", "/fail").with_status(500).create();

        let cache = setup_cache();
        let client = Client::new();
        let url = format!("{}/fail", server.url());

        let result = cache.put(&url, &client).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Failed to scrape"));
        mock.assert();
    }

    #[tokio::test]
    async fn put_upserts_on_duplicate_url() {
        let mut server = Server::new_async().await;
        let _m1 = mock_html_endpoint(&mut server, "/page", "<html>v1</html>");

        let cache = setup_cache();
        let client = Client::new();
        let url = format!("{}/page", server.url());

        cache.put(&url, &client).await.unwrap();

        // Drop and recreate mock with new body
        let mut server2 = Server::new_async().await;
        let _m2 = mock_html_endpoint(&mut server2, "/page", "<html>v2</html>");
        let url2 = format!("{}/page", server2.url());

        let result = cache.put(&url2, &client).await.unwrap();
        assert_eq!(result, "<html>v2</html>");
    }
}
