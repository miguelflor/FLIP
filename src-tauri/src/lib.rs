mod commands;
mod constants;
mod parser;
mod types;
mod utils;

use std::collections::HashMap;
use std::sync::Arc;

use parking_lot::Mutex;
use reqwest::Client;
use reqwest_cookie_store::CookieStoreMutex;
use serde::Deserialize;

#[derive(Deserialize)]
struct Config {
    logging: bool,
}

// Session data stored in app state
pub struct Session {
    pub client: Client,
    #[allow(dead_code)]
    pub cookie_store: Arc<CookieStoreMutex>,
    pub aluno_ids: HashMap<String, String>,
}

pub struct AppState {
    pub sessions: Mutex<HashMap<String, Session>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config: Config = std::fs::read_to_string("config.json")
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
        .unwrap_or(Config { logging: false });

    let mut builder = tauri::Builder::default()
        .manage(AppState::default());

    if config.logging {
        builder = builder.plugin(tauri_plugin_log::Builder::default().build());
    }

    builder
        .invoke_handler(tauri::generate_handler![
            commands::login,
            commands::get_student_info,
            commands::get_chairs,
            commands::get_available_years,
            commands::get_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
