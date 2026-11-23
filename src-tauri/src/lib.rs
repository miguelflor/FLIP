mod cache;
mod commands;
mod constants;
mod errors;
mod parser;
mod session;
mod types;
mod url;
mod utils;

use std::collections::HashMap;

use cache::setup_cache;
use parking_lot::Mutex;
use serde::Deserialize;
use session::ClipClient;

#[derive(Deserialize)]
struct Config {
    logging: bool,
}

// Session data stored in app state
pub struct Session {
    pub client: ClipClient,
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
        .setup(|app| {
            setup_cache(app)?;
            Ok(())
        })
        .manage(AppState::default());

    if config.logging {
        builder = builder.plugin(tauri_plugin_log::Builder::default().build());
    }

    builder
        .invoke_handler(tauri::generate_handler![
            commands::login,
            commands::auto_login,
            commands::logout,
            commands::get_student_info,
            commands::get_chairs,
            commands::get_available_years,
            commands::get_file,
            commands::list_files,
            commands::download_file,
            commands::get_schedule,
            commands::get_tests,
            commands::reset_cache
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
