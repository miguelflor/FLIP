use crate::utils::decode_latin1;
use keyring::Entry;
use rand::RngCore;
use reqwest::Client;
use rusqlite::{Connection, OptionalExtension};
use std::error::Error;
use std::fs;
use std::sync::Mutex;
use tauri::Manager;

const DB_NAME: &str = "cache.db";
const APP_NAME: &str = "flip";

pub struct CacheHandler {
    db: Connection,
}

impl CacheHandler {
    pub fn new(conn: Connection) -> Self {
        Self { db: conn }
    }

    fn update(&self, url: &str, html: &str) -> Result<(), ()> {
        let result = self
            .db
            .execute("UPDATE html_cache SET html=?2 WHERE url=?1", [url, html]);

        match result {
            Ok(_) => Ok(()),
            Err(_) => Err(()),
        }
    }

    fn put(&self, url: &str, html: &str) -> Result<(), ()> {
        let result = self
            .db
            .execute("INSERT INTO html_cache VALUES (?1, ?2)", [url, html]);

        match result {
            Ok(_) => Ok(()),
            Err(_) => Err(()),
        }
    }

    pub async fn get(&self, url: &str, client: &Client) -> Result<String, String> {
        let result = self
            .db
            .query_row("SELECT html FROM html_cache WHERE url=?1", [url], |row| {
                row.get(0)
            })
            .optional();

        match result {
            Err(_) => {
                return Err(format!("sqlite select for {}", url));
            }
            Ok(None) => {
                let response = client.get(url).send().await.map_err(|e| e.to_string())?;

                if !response.status().is_success() {
                    return Err(format!("Failed to scrape {}", url));
                }

                let html_bytes = response.bytes().await.map_err(|e| e.to_string())?;
                let html = decode_latin1(&html_bytes);

                self.put(url, &html);

                return Ok(html);
            }
            Ok(Some(x)) => {
                return Ok(x);
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
        "CREATE TABLE IF NOT EXISTS html_cache (url TEXT PRIMARY KEY, html TEXT NOT NULL);",
    )?;

    app.manage(Mutex::new(CacheHandler::new(conn)));
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
    let key: String = bytes.iter().map(|b| format!("{b:02x}")).collect();
    return key;
}
