use crate::errors::CACHE_ERROR;
use crate::session::{fetch, ClipClient};
use crate::url::UrlType::{Documents, Photo, Schedule, StudentInfo, Tests};
use crate::url::{Url, UrlType};
use crate::utils::decode_clip_text;
use base64::{engine::general_purpose::STANDARD, Engine};
use chrono::{DateTime, Duration, Utc};
use keyring::Entry;
use rand::RngCore;
use rusqlite::{params, Connection, OptionalExtension};
use std::error::Error;
use std::fs;
use std::path::Path;
use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

const DB_NAME: &str = "cache.db";
pub const APP_NAME: &str = "flip";

struct CacheEntry {
    html: String,
    updated_at: DateTime<Utc>,
}

#[derive(Clone)]
pub struct CacheHandler {
    db: Arc<Mutex<Connection>>,
}

impl CacheHandler {
    pub fn new(conn: Connection) -> Self {
        Self {
            db: Arc::new(Mutex::new(conn)),
        }
    }

    // Fetches url, stores result in cache, and returns the html.
    pub async fn put(&self, url: &Url, client: &ClipClient) -> Result<String, String> {
        let now = Utc::now();
        let html_bytes = fetch(client, &url.value).await?;
        // Photos are binary: store them base64-encoded so they survive as TEXT.
        let html = match url.url_type {
            UrlType::Photo => STANDARD.encode(&html_bytes),
            _ => decode_clip_text(&html_bytes),
        };

        let db = self.db.lock().await;
        let result = db.execute(
            "INSERT INTO html_cache (url, html, updated_at)
             VALUES (?1, ?2, ?3)
             ON CONFLICT(url) DO UPDATE SET
                html = excluded.html,
                updated_at = excluded.updated_at",
            params![url.value, html, now],
        );

        match result {
            Ok(_) => Ok(html),
            Err(e) => {
                log::warn!("Failed to update cache with {url}: {e}");
                Err(CACHE_ERROR.to_string())
            }
        }
    }

    pub async fn reset(&self) -> Result<(), String> {
        let db = self.db.lock().await;
        db.execute("DELETE FROM html_cache", [])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // Returns cached html if fresh, otherwise fetches and updates the cache.
    pub async fn get(&self, url: &Url, client: &ClipClient) -> Result<String, String> {
        let result = self
            .db
            .lock()
            .await
            .query_row(
                "SELECT html, updated_at FROM html_cache WHERE url=?1",
                [&url.value],
                |row| {
                    Ok(CacheEntry {
                        html: row.get(0)?,
                        updated_at: row.get(1)?,
                    })
                },
            )
            .optional();

        match result {
            Err(e) => {
                log::warn!("Failed to read cache for {url}: {e}");
                Err(CACHE_ERROR.to_string())
            }
            Ok(None) => {
                let html = self.put(url, client).await?;

                Ok(html)
            }
            Ok(Some(entry)) => {
                let now = Utc::now();
                let elapsed = now - entry.updated_at;
                let duration = cache_duration(&url.url_type);

                if elapsed > duration {
                    let html = self.put(url, client).await?;
                    return Ok(html);
                }

                Ok(entry.html)
            }
        }
    }
}

fn cache_duration(url_type: &UrlType) -> Duration {
    match url_type {
        StudentInfo => Duration::days(7),
        Photo => Duration::days(7),
        Documents => Duration::hours(10),
        Schedule | Tests => Duration::days(1),
    }
}

pub fn setup_cache(app: &mut tauri::App) -> Result<(), Box<dyn Error>> {
    let data_dir = app.path().app_local_data_dir()?;

    fs::create_dir_all(&data_dir)?;

    let db_path = data_dir.join(DB_NAME);
    let key = get_or_create_db_key()?;
    app.manage(CacheHandler::new(open_or_recreate(&db_path, &key)?));
    Ok(())
}

// The cache is disposable: if it can't be opened (e.g. the key was lost), start a fresh one.
fn open_or_recreate(db_path: &Path, key: &str) -> rusqlite::Result<Connection> {
    open_db(db_path, key).or_else(|_| {
        // open_db has dropped its connection, so Windows lets us delete the file.
        let _ = fs::remove_file(db_path);
        open_db(db_path, key)
    })
}

fn open_db(db_path: &Path, key: &str) -> rusqlite::Result<Connection> {
    let conn = Connection::open(db_path)?;
    conn.pragma_update(None, "key", key)?;
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS html_cache (url TEXT PRIMARY KEY, html TEXT NOT NULL, updated_at TEXT NOT NULL);",
    )?;
    Ok(conn)
}

fn get_or_create_db_key() -> Result<String, Box<dyn Error>> {
    let entry = Entry::new(APP_NAME, "db-encryption-key")?;

    match entry.get_password() {
        Ok(key) => Ok(key),
        Err(keyring::Error::NoEntry) => {
            let key = generate_random_key();
            entry.set_password(&key)?;
            Ok(key)
        }
        Err(e) => Err(e.into()),
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
    use crate::url::{Url, UrlType};
    use mockito::{Mock, Server};
    use reqwest::Client;

    fn client() -> ClipClient {
        ClipClient {
            http: Client::new(),
            username: String::new(),
        }
    }

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

    #[test]
    fn open_or_recreate_recovers_from_wrong_key() {
        let path = std::env::temp_dir().join(format!("flip-test-{}.db", generate_random_key()));
        let conn = open_or_recreate(&path, "key-a").unwrap();
        conn.execute("INSERT INTO html_cache VALUES ('u', 'h', 't')", [])
            .unwrap();
        drop(conn);

        // Lost key: the old file is unreadable, so a fresh empty cache replaces it.
        let conn = open_or_recreate(&path, "key-b").unwrap();
        let rows: i64 = conn
            .query_row("SELECT COUNT(*) FROM html_cache", [], |r| r.get(0))
            .unwrap();
        assert_eq!(rows, 0);
        drop(conn);
        fs::remove_file(&path).unwrap();
    }

    #[tokio::test]
    async fn get_inserts_into_cache_on_miss() {
        let mut server = Server::new_async().await;
        let mock = mock_html_endpoint(&mut server, "/page", "<html>hello</html>");

        let cache = setup_cache();
        let client = client();
        let url = Url {
            value: format!("{}/page", server.url()),
            url_type: UrlType::Documents,
        };

        let result = cache.get(&url, &client).await.unwrap();
        assert_eq!(result, "<html>hello</html>");
        mock.assert();
    }

    #[tokio::test]
    async fn get_returns_cached_html_without_fetching() {
        let mut server = Server::new_async().await;
        let mock = mock_html_endpoint(&mut server, "/page", "<html>first</html>");

        let cache = setup_cache();
        let client = client();
        let url = Url {
            value: format!("{}/page", server.url()),
            url_type: UrlType::Documents,
        };

        // First call populates cache
        cache.get(&url, &client).await.unwrap();
        mock.assert();

        // Second call should not hit the server
        let mock2 = server
            .mock("GET", "/page")
            .with_body("second")
            .expect(0)
            .create();
        let result = cache.get(&url, &client).await.unwrap();
        assert_eq!(result, "<html>first</html>");
        mock2.assert();
    }

    #[tokio::test]
    async fn get_refreshes_cache_when_expired() {
        let cache = setup_cache();
        let client = client();

        let mut server = Server::new_async().await;
        let url = Url {
            value: format!("{}/page", server.url()),
            url_type: UrlType::Documents,
        };

        let stale_time = Utc::now() - cache_duration(&url.url_type) - Duration::minutes(1);
        cache
            .db
            .lock()
            .await
            .execute(
                "INSERT INTO html_cache (url, html, updated_at) VALUES (?1, ?2, ?3)",
                params![url.value, "<html>old</html>", stale_time],
            )
            .unwrap();

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
        let client = client();
        let url = Url {
            value: format!("{}/fail", server.url()),
            url_type: UrlType::Documents,
        };

        let result = cache.put(&url, &client).await;
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "O CLIP respondeu com um erro (500)");
        mock.assert();
    }

    #[tokio::test]
    async fn put_upserts_on_duplicate_url() {
        let mut server = Server::new_async().await;
        let _m1 = mock_html_endpoint(&mut server, "/page", "<html>v1</html>");

        let cache = setup_cache();
        let client = client();
        let url = Url {
            value: format!("{}/page", server.url()),
            url_type: UrlType::Documents,
        };

        cache.put(&url, &client).await.unwrap();

        // Drop and recreate mock with new body
        let mut server2 = Server::new_async().await;
        let _m2 = mock_html_endpoint(&mut server2, "/page", "<html>v2</html>");
        let url2 = Url {
            value: format!("{}/page", server2.url()),
            url_type: UrlType::Documents,
        };

        let result = cache.put(&url2, &client).await.unwrap();
        assert_eq!(result, "<html>v2</html>");
    }
}
