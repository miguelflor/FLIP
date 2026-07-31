use keyring::Entry;
use rand::RngCore;
use rusqlite::Connection;
use std::error::Error;
use std::fs;
use std::sync::Mutex;
use tauri::Manager;

const DB_NAME: &str = "cache.db";
const APP_NAME: &str = "flip";

pub struct CacheHandler {
    pub db: Connection,
}

impl CacheHandler {
    pub fn new(conn: Connection) -> Self {
        Self { db: conn }
    }
}

struct Site {
    url: String,
    html: String,
}

pub fn setup_cache(app: &mut tauri::App) -> Result<(), Box<dyn Error>> {
    let data_dir = app.path().app_local_data_dir()?;

    fs::create_dir_all(&data_dir)?;

    let db_path = data_dir.join(DB_NAME);
    let conn = Connection::open(&db_path)?;
    let key = get_or_create_db_key()?;
    conn.pragma_update(None, "key",key)?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS html_cache (url TEXT PRIMARY KEY, html TEXT NOT NULL);",
    )?;

    app.manage(Mutex::new(CacheHandler::new(conn)));
    Ok(())
}

fn get_or_create_db_key() -> Result<String, Box<dyn std::error::Error>> {
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
