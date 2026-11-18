use std::collections::HashMap;

use reqwest::{header::CONTENT_TYPE, Client};
use tauri::State;

use crate::commands::{load_credentials, post_login};
use crate::AppState;

pub const SESSION_EXPIRED: &str = "Sessão expirada, inicie sessão novamente";

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

/// GETs a CLIP url. When CLIP's session has expired it serves its login page instead,
/// so this logs the same client back in with the saved login and retries once.
// ponytail: parallel fetches (list_files) may each re-login at once; add a lock if CLIP minds.
pub async fn fetch(client: &Client, url: &str) -> Result<Vec<u8>, String> {
    match get(client, url).await? {
        Some(bytes) => Ok(bytes),
        None => {
            let (username, password) = load_credentials().ok_or(SESSION_EXPIRED)?;
            post_login(client, &username, &password).await?;
            get(client, url)
                .await?
                .ok_or_else(|| SESSION_EXPIRED.to_string())
        }
    }
}

/// `None` when CLIP answered with its login page.
async fn get(client: &Client, url: &str) -> Result<Option<Vec<u8>>, String> {
    let response = client.get(url).send().await.map_err(|e| e.to_string())?;
    if !response.status().is_success() {
        return Err(format!("Failed to scrape {} ({})", url, response.status()));
    }
    let is_html = response
        .headers()
        .get(CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .is_some_and(|v| v.starts_with("text/html"));
    let bytes = response.bytes().await.map_err(|e| e.to_string())?.to_vec();
    Ok((!(is_html && is_login_page(&bytes))).then_some(bytes))
}

fn is_login_page(html: &[u8]) -> bool {
    const MARKER: &[u8] = br#"id="loginForm""#;
    html.windows(MARKER.len()).any(|w| w == MARKER)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_clip_login_page() {
        assert!(is_login_page(
            br#"<form id="loginForm" action="/login-router" method="POST">"#
        ));
        assert!(!is_login_page(
            b"<html><a href=\"/utente/eu/aluno\">Aluno</a></html>"
        ));
    }

    #[tokio::test]
    async fn fetch_passes_through_normal_pages() {
        let mut server = mockito::Server::new_async().await;
        let _m = server
            .mock("GET", "/page")
            .with_header("content-type", "text/html")
            .with_body("<html>ok</html>")
            .create();
        let bytes = fetch(&Client::new(), &format!("{}/page", server.url()))
            .await
            .unwrap();
        assert_eq!(bytes, b"<html>ok</html>");
    }
}
