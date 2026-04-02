mod commands;

use std::collections::HashMap;
use std::sync::Arc;

use parking_lot::Mutex;
use reqwest::Client;
use reqwest_cookie_store::CookieStoreMutex;

// Session data stored in app state
pub struct Session {
    pub client: Client,
    #[allow(dead_code)]
    pub cookie_store: Arc<CookieStoreMutex>,
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
    tauri::Builder::default()
        .manage(AppState::default())
        .plugin(tauri_plugin_log::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            commands::login,
            commands::get_chairs,
            commands::get_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
