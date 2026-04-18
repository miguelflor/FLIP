use std::collections::HashMap;

use reqwest::Client;
use tauri::State;

use crate::AppState;

/// Retrieves the HTTP client and aluno_ids for the given session.
/// Returns `Err` if the session is not found or has expired.
pub fn get_session(
    state: &State<'_, AppState>,
    session_id: &str,
) -> Result<(Client, HashMap<String, String>), String> {
    let sessions = state.sessions.lock();
    match sessions.get(session_id) {
        Some(s) => Ok((s.client.clone(), s.aluno_ids.clone())),
        None => Err("Session not found or expired".to_string()),
    }
}
