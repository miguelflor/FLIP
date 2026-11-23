use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use reqwest::redirect::Policy;
use reqwest::{header::CONTENT_TYPE, Client, ClientBuilder};
use reqwest_cookie_store::{CookieStore, CookieStoreMutex};
use tauri::State;

use crate::commands::{load_credentials, post_login};
use crate::constants::USER_AGENT;
use crate::errors::{net_error, SESSION_EXPIRED};
use crate::AppState;

const CONNECT_TIMEOUT: Duration = Duration::from_secs(10);
/// Longest wait for the next bytes of a response: a slow download that keeps moving is fine,
/// a CLIP that stops answering is not.
const READ_TIMEOUT: Duration = Duration::from_secs(30);

/// A fresh client with its own cookie jar, for one CLIP login.
pub fn new_http_client() -> Result<Client, String> {
    client_builder().build().map_err(|e| e.to_string())
}

fn client_builder() -> ClientBuilder {
    Client::builder()
        .cookie_provider(Arc::new(CookieStoreMutex::new(CookieStore::default())))
        .user_agent(USER_AGENT)
        .redirect(Policy::limited(10))
        .connect_timeout(CONNECT_TIMEOUT)
        .read_timeout(READ_TIMEOUT)
}

/// An HTTP client logged into CLIP, and the user it is logged in as.
#[derive(Clone)]
pub struct ClipClient {
    pub http: Client,
    pub username: String,
}

/// Retrieves the HTTP client and aluno_ids for the given session.
/// Returns `Err` if the session is not found or has expired.
pub fn get_session(
    state: &State<'_, AppState>,
    session_id: &str,
) -> Result<(ClipClient, HashMap<String, String>), String> {
    let sessions = state.sessions.lock();
    match sessions.get(session_id) {
        Some(s) => Ok((s.client.clone(), s.aluno_ids.clone())),
        None => Err("Session not found or expired".to_string()),
    }
}

/// GETs a CLIP url. When CLIP's session has expired it serves its login page instead,
/// so this logs the same client back in with the saved login and retries once.
// ponytail: parallel fetches (list_files) may each re-login at once; add a lock if CLIP minds.
pub async fn fetch(client: &ClipClient, url: &str) -> Result<Vec<u8>, String> {
    match get(&client.http, url).await? {
        Some(bytes) => Ok(bytes),
        None => {
            let password =
                saved_password_for(&client.username, load_credentials()).ok_or(SESSION_EXPIRED)?;
            post_login(&client.http, &client.username, &password).await?;
            get(&client.http, url)
                .await?
                .ok_or_else(|| SESSION_EXPIRED.to_string())
        }
    }
}

/// The saved password, only if it belongs to `username`: the keyring may hold another
/// person's login, and re-logging this client with it would switch accounts.
fn saved_password_for(username: &str, saved: Option<(String, String)>) -> Option<String> {
    saved
        .filter(|(user, _)| user == username)
        .map(|(_, pass)| pass)
}

/// `None` when CLIP answered with its login page.
async fn get(client: &Client, url: &str) -> Result<Option<Vec<u8>>, String> {
    let response = client.get(url).send().await.map_err(net_error)?;
    if !response.status().is_success() {
        return Err(format!("Failed to scrape {} ({})", url, response.status()));
    }
    let is_html = response
        .headers()
        .get(CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .is_some_and(|v| v.starts_with("text/html"));
    let bytes = response.bytes().await.map_err(net_error)?.to_vec();
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

    #[test]
    fn relogin_only_with_own_saved_password() {
        let saved = || Some(("a.user".to_string(), "pw".to_string()));
        assert_eq!(saved_password_for("a.user", saved()).as_deref(), Some("pw"));
        assert_eq!(saved_password_for("b.user", saved()), None);
        assert_eq!(saved_password_for("a.user", None), None);
    }

    #[tokio::test]
    async fn fetch_gives_up_on_a_server_that_stops_answering() {
        // Accepts the connection, then never sends a byte.
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        tokio::spawn(async move {
            let (_socket, _) = listener.accept().await.unwrap();
            std::future::pending::<()>().await;
        });
        let client = ClipClient {
            http: client_builder()
                .read_timeout(Duration::from_millis(200))
                .build()
                .unwrap(),
            username: String::new(),
        };
        let started = std::time::Instant::now();
        let err = fetch(&client, &format!("http://{addr}/page"))
            .await
            .unwrap_err();
        assert_eq!(err, crate::errors::CLIP_TIMEOUT);
        assert!(started.elapsed() < Duration::from_secs(5));
    }

    #[tokio::test]
    async fn fetch_passes_through_normal_pages() {
        let mut server = mockito::Server::new_async().await;
        let _m = server
            .mock("GET", "/page")
            .with_header("content-type", "text/html")
            .with_body("<html>ok</html>")
            .create();
        let client = ClipClient {
            http: Client::new(),
            username: String::new(),
        };
        let bytes = fetch(&client, &format!("{}/page", server.url()))
            .await
            .unwrap();
        assert_eq!(bytes, b"<html>ok</html>");
    }
}
