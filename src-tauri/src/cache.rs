use std::error::Error;
use rusqlite::Connection;
use std::sync::Mutex;
use std::fs;
use tauri::Manager;

const DB_NAME: &str = "cache.db";

pub struct CacheHandler {
    pub db: Connection
}

impl CacheHandler {
    pub fn new(conn: Connection) -> Self{
        Self {
            db: conn
        }
    }
}


struct Site {
    url: String,
    html: String
}


pub fn setup_cache(app: &mut tauri::App) -> Result<(), Box<dyn Error>>{

    let data_dir = app.path().app_local_data_dir()?;

    fs::create_dir_all(&data_dir)?;

    let db_path = data_dir.join(DB_NAME);
    let conn = Connection::open(&db_path)?;

    conn.execute_batch("CREATE TABLE IF NOT EXISTS html_cache (url TEXT PRIMARY KEY, html TEXT NOT NULL);")?;

    app.manage(Mutex::new(CacheHandler::new(conn)));
    Ok(())
}



