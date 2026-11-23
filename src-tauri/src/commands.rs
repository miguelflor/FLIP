use std::collections::HashMap;
use std::io::{Cursor, Write};

use base64::{engine::general_purpose::STANDARD, Engine};
use keyring::Entry;
use reqwest::Client;
use tauri::{command, AppHandle, State};
use uuid::Uuid;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

use crate::cache::{CacheHandler, APP_NAME};
use crate::constants::{CLIP_BASE, CLIP_HOME, FILE_TYPES};
use crate::downloads::{downloads_dir, save_new_file};
use crate::errors::{
    http_error, net_error, INVALID_CREDENTIALS, INVALID_FILE_LINK, LOGIN_FAILED, NO_STUDENT_DATA,
    SCHEDULE_UNREADABLE, STUDENT_INFO_UNREADABLE,
};
use crate::parser::{
    extract_aluno_ids, extract_student_info, file_name_from_href, parse_chairs, parse_file_urls,
    parse_files, parse_schedule, parse_tests,
};
use crate::session::{
    fetch, get_session, get_student_session, is_login_page, new_http_client, ClipClient,
};
use crate::types::{
    ChairsResponse, CourseFile, FileParams, FileResponse, LoginResponse, Schedule, StudentInfo,
    Test,
};
use crate::url::Url;
use crate::utils::{decode_clip_text, get_type_name};
use crate::{AppState, Session};

type VecThr<T> = Vec<tokio::task::JoinHandle<T>>;

fn credentials_entry() -> keyring::Result<Entry> {
    Entry::new(APP_NAME, "credentials")
}

// Keyring failures (e.g. no Secret Service on Linux) mean "not remembered", never a login error.
fn save_credentials(username: &str, password: &str) {
    if let (Ok(entry), Ok(json)) = (
        credentials_entry(),
        serde_json::to_string(&(username, password)),
    ) {
        let _ = entry.set_password(&json);
    }
}

pub(crate) fn load_credentials() -> Option<(String, String)> {
    let json = credentials_entry().ok()?.get_password().ok()?;
    serde_json::from_str(&json).ok()
}

fn forget_credentials() {
    if let Ok(entry) = credentials_entry() {
        let _ = entry.delete_credential();
    }
}

#[command]
pub async fn login(
    state: State<'_, AppState>,
    username: String,
    password: String,
    remember: bool,
) -> Result<LoginResponse, String> {
    let response = authenticate(&state, &username, &password).await?;
    if remember {
        save_credentials(&username, &password);
    }
    Ok(response)
}

/// Logs in with the credentials saved in the OS keyring. `None` when nothing is saved
/// or the saved password was rejected (in which case it is forgotten).
#[command]
pub async fn auto_login(state: State<'_, AppState>) -> Result<Option<LoginResponse>, String> {
    let Some((username, password)) = load_credentials() else {
        return Ok(None);
    };
    match authenticate(&state, &username, &password).await {
        Err(e) if e == INVALID_CREDENTIALS => {
            forget_credentials();
            Ok(None)
        }
        result => result.map(Some),
    }
}

/// Ends the session: drops its logged-in client, forgets the saved login and clears the
/// cache, so nothing of this account's is left on the computer.
#[command]
pub async fn logout(
    state: State<'_, AppState>,
    cache: State<'_, CacheHandler>,
    session_id: String,
) -> Result<(), String> {
    state.sessions.lock().remove(&session_id);
    forget_credentials();
    cache.reset().await
}

async fn authenticate(
    state: &State<'_, AppState>,
    username: &str,
    password: &str,
) -> Result<LoginResponse, String> {
    let client = new_http_client()?;

    post_login(&client, username, password).await?;

    let session_id = Uuid::new_v4().to_string();

    let home = client.get(CLIP_HOME).send().await.map_err(net_error)?;
    if !home.status().is_success() {
        return Err(http_error(CLIP_HOME, home.status()));
    }
    let aluno_ids = students_from_home(&home.text().await.map_err(net_error)?)?;

    let session = Session {
        client: ClipClient {
            http: client,
            username: username.to_string(),
        },
        aluno_ids: aluno_ids.clone(),
    };

    let session_id_copy = session_id.clone();
    state.sessions.lock().insert(session_id, session);

    Ok(LoginResponse {
        session_id: session_id_copy,
        aluno_ids,
    })
}

/// The student ids on CLIP's home page. Login only counts as done once they are there:
/// a home page without them means CLIP did not really let us in.
fn students_from_home(home_html: &str) -> Result<HashMap<String, String>, String> {
    if is_login_page(home_html.as_bytes()) {
        return Err(LOGIN_FAILED.to_string());
    }
    let aluno_ids = extract_aluno_ids(home_html);
    if aluno_ids.is_empty() {
        return Err(NO_STUDENT_DATA.to_string());
    }
    Ok(aluno_ids)
}

/// Logs `client` into CLIP; its cookie store then holds the new session.
pub(crate) async fn post_login(
    client: &Client,
    username: &str,
    password: &str,
) -> Result<(), String> {
    post_login_to(client, CLIP_HOME, username, password).await
}

async fn post_login_to(
    client: &Client,
    url: &str,
    username: &str,
    password: &str,
) -> Result<(), String> {
    let mut form_data = HashMap::new();
    form_data.insert("identificador", username);
    form_data.insert("senha", password);

    let response = client
        .post(url)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .form(&form_data)
        .send()
        .await
        .map_err(net_error)?;

    if !response.status().is_success() {
        return Err(LOGIN_FAILED.to_string());
    }
    let html = response.text().await.map_err(net_error)?;
    if html.contains("Autenticação inválida") {
        return Err(INVALID_CREDENTIALS.to_string());
    }
    // Still on the login form: CLIP refused without saying why (e.g. a blocked account)
    if is_login_page(html.as_bytes()) {
        return Err(LOGIN_FAILED.to_string());
    }
    Ok(())
}

#[command]
pub async fn get_student_info(
    state: State<'_, AppState>,
    cache: State<'_, CacheHandler>,
    session_id: String,
    student_id: String,
) -> Result<StudentInfo, String> {
    let client = get_student_session(&state, &session_id, &student_id)?;

    let url = Url::student(&student_id);

    let html = cache.get(&url, &client).await?;

    // Extract student info from HTML
    if let Some(parsed_info) = extract_student_info(&html) {
        // Photo comes back from the cache already base64-encoded
        let photo_data = cache.get(&parsed_info.photo_url, &client).await.ok();

        Ok(StudentInfo {
            photo_data,
            student_name: parsed_info.student_name,
            course: parsed_info.course,
        })
    } else {
        Err(STUDENT_INFO_UNREADABLE.to_string())
    }
}

#[command]
pub async fn get_chairs(
    state: State<'_, AppState>,
    cache: State<'_, CacheHandler>,
    session_id: String,
    student_id: String,
    year: String,
    use_cache: Option<bool>,
) -> Result<ChairsResponse, String> {
    let client = get_student_session(&state, &session_id, &student_id)?;

    let url = Url::year_student(&year, student_id.as_str());

    let fetch = if use_cache.unwrap_or(true) {
        cache.get(&url, &client).await
    } else {
        cache.put(&url, &client).await
    };

    let html = match fetch {
        Ok(h) => h,
        Err(e) => {
            return Ok(ChairsResponse {
                success: false,
                chairs: None,
                error: Some(e),
            })
        }
    };

    let chairs = parse_chairs(&html);

    Ok(ChairsResponse {
        success: true,
        chairs: Some(chairs),
        error: None,
    })
}

#[command]
pub async fn get_available_years(
    state: State<'_, AppState>,
    cache: State<'_, CacheHandler>,
    session_id: String,
    student_id: String,
) -> Result<serde_json::Value, String> {
    let client = get_student_session(&state, &session_id, &student_id)?;

    let url = Url::student_years(&student_id);

    let body = cache.get(&url, &client).await?;
    let years = crate::parser::extract_years(&body);

    Ok(serde_json::json!({
        "success": true,
        "years": years,
        "error": null
    }))
}

#[command]
pub async fn get_file(
    state: State<'_, AppState>,
    params: FileParams,
    student_id: String,
    year: String,
) -> Result<FileResponse, String> {
    let client = get_student_session(&state, &params.session_id, &student_id)?;

    let file_types: Vec<String> = if params.file_type == "all" {
        FILE_TYPES
            .iter()
            .map(|(code, _)| code.to_string())
            .collect()
    } else {
        vec![params.file_type.clone()]
    };

    let folder_name = format!("{}-{}", year, params.name);

    // Spawn a task per file type
    let mut handles: VecThr<Vec<(String, Vec<u8>)>> = Vec::new();

    for type_code in file_types {
        let client = client.clone();
        let folder_name = folder_name.clone();
        let params_year = params.year.clone();
        let params_period = params.period.clone();
        let params_type_period = params.type_period.clone();
        let params_unit_id = params.unit_id.clone();
        let student_id = student_id.clone();

        let handle = tokio::spawn(async move {
            let mut files: Vec<(String, Vec<u8>)> = Vec::new();

            let url = Url::documents(
                &student_id,
                &params_year,
                &params_period,
                &params_type_period,
                &params_unit_id,
                &type_code,
            );

            let html = match fetch(&client, &url.value).await {
                Ok(bytes) => decode_clip_text(&bytes),
                Err(_) => return files,
            };
            let file_urls = parse_file_urls(&html);
            let type_folder = format!("{}/{}", folder_name, get_type_name(&type_code));

            // Spawn a subtask per file
            let mut file_handles: VecThr<Option<(String, Vec<u8>)>> = Vec::new();

            for href in file_urls {
                let client = client.clone();
                let type_folder = type_folder.clone();
                let href = href.clone();

                let file_handle = tokio::spawn(async move {
                    let file_url = format!("{}{}", CLIP_BASE, href);
                    let file_data = fetch(&client, &file_url).await.ok()?;
                    let filename = file_name_from_href(&href);

                    let zip_path = format!("{}/{}", type_folder, filename);
                    Some((zip_path, file_data.to_vec()))
                });

                file_handles.push(file_handle);
            }

            for fh in file_handles {
                if let Ok(Some(file)) = fh.await {
                    files.push(file);
                }
            }

            files
        });
        handles.push(handle);
    }

    // Join all tasks and collect results
    let mut total_files = 0;
    let mut zip_buffer = Cursor::new(Vec::new());
    {
        let mut zip = ZipWriter::new(&mut zip_buffer);
        let options =
            SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

        for handle in handles {
            let files = handle.await.unwrap_or_default();
            for (zip_path, file_data) in files {
                if zip.start_file(&zip_path, options).is_ok() {
                    let _ = zip.write_all(&file_data);
                    total_files += 1;
                }
            }
        }

        zip.finish().map_err(|e| e.to_string())?;
    }

    // Return error if no files were found
    if total_files == 0 {
        return Ok(FileResponse {
            success: false,
            data: None,
            filename: None,
            error: Some(format!("{} não tem ficheiros", params.name)),
        });
    }

    let zip_data = zip_buffer.into_inner();
    let base64_data = STANDARD.encode(&zip_data);

    Ok(FileResponse {
        success: true,
        data: Some(base64_data),
        filename: Some(format!("{}-{}.zip", params.name, params.period)),
        error: None,
    })
}

#[command]
pub async fn list_files(
    state: State<'_, AppState>,
    params: FileParams,
    student_id: String,
) -> Result<Vec<CourseFile>, String> {
    let client = get_student_session(&state, &params.session_id, &student_id)?;

    let pages = FILE_TYPES
        .iter()
        .map(|(code, name)| {
            let url = Url::documents(
                &student_id,
                &params.year,
                &params.period,
                &params.type_period,
                &params.unit_id,
                code,
            );
            (url.value, *name)
        })
        .collect();
    files_on_pages(&client, pages).await
}

/// The files on a unit's documents pages, one page per file type, fetched in parallel.
/// Fails if any page does: a partial list would pass for the unit's complete one.
/// Not cached, since CLIP file links expire with the session.
async fn files_on_pages(
    client: &ClipClient,
    pages: Vec<(String, &'static str)>,
) -> Result<Vec<CourseFile>, String> {
    let handles: VecThr<Result<Vec<CourseFile>, String>> = pages
        .into_iter()
        .map(|(url, type_name)| {
            let client = client.clone();
            tokio::spawn(async move {
                let html = decode_clip_text(&fetch(&client, &url).await?);
                Ok(parse_files(&html, type_name))
            })
        })
        .collect();

    let mut files = Vec::new();
    for h in handles {
        files.extend(h.await.map_err(|e| e.to_string())??);
    }
    Ok(files)
}

/// Downloads a CLIP file into the downloads folder, and returns where it was saved.
#[command]
pub async fn download_file(
    app: AppHandle,
    state: State<'_, AppState>,
    session_id: String,
    href: String,
) -> Result<String, String> {
    let (client, _) = get_session(&state, &session_id)?;

    // Only CLIP document links: keeps the authenticated client off arbitrary URLs
    if !is_clip_file_link(&href) {
        return Err(INVALID_FILE_LINK.to_string());
    }

    let bytes = fetch(&client, &format!("{}{}", CLIP_BASE, href)).await?;
    let path = save_new_file(&downloads_dir(&app)?, &file_name_from_href(&href), &bytes)?;
    Ok(path.display().to_string())
}

fn is_clip_file_link(href: &str) -> bool {
    href.starts_with('/') && href.contains("/objecto?")
}

/// Saves a file the app made itself (a schedule image or calendar) into the downloads folder,
/// and returns where it was saved.
#[command]
pub fn save_download(app: AppHandle, name: String, data: Vec<u8>) -> Result<String, String> {
    let path = save_new_file(&downloads_dir(&app)?, &name, &data)?;
    Ok(path.display().to_string())
}

#[command]
pub async fn get_schedule(
    state: State<'_, AppState>,
    cache: State<'_, CacheHandler>,
    session_id: String,
    student_id: String,
    year: Option<String>,
    period: Option<String>,
    use_cache: Option<bool>,
) -> Result<Schedule, String> {
    let client = get_student_session(&state, &session_id, &student_id)?;

    let url = Url::schedule(&student_id, year.as_deref(), period.as_deref());

    let html = if use_cache.unwrap_or(true) {
        cache.get(&url, &client).await?
    } else {
        cache.put(&url, &client).await?
    };

    parse_schedule(&html).map_err(|e| {
        log::warn!("Unreadable schedule: {e}");
        SCHEDULE_UNREADABLE.to_string()
    })
}

#[command]
pub async fn get_tests(
    state: State<'_, AppState>,
    cache: State<'_, CacheHandler>,
    session_id: String,
    student_id: String,
    year: Option<String>,
    period: Option<String>,
    use_cache: Option<bool>,
) -> Result<Vec<Test>, String> {
    let client = get_student_session(&state, &session_id, &student_id)?;
    let url = Url::tests(&student_id, year.as_deref(), period.as_deref());
    let html = if use_cache.unwrap_or(true) {
        cache.get(&url, &client).await?
    } else {
        cache.put(&url, &client).await?
    };
    Ok(parse_tests(&html))
}

#[command]
pub async fn reset_cache(cache: State<'_, CacheHandler>) -> Result<(), String> {
    cache.reset().await
}

#[cfg(test)]
mod tests {
    use super::*;

    const HOME: &str = r#"<a href="/utente/eu/aluno?aluno=123">Ana Silva</a>"#;
    const LOGIN_FORM: &str = r#"<form id="loginForm" action="/login-router" method="POST">"#;

    async fn post_login_answered_with(body: &str) -> Result<(), String> {
        let mut server = mockito::Server::new_async().await;
        let _m = server
            .mock("POST", "/")
            .match_body(mockito::Matcher::UrlEncoded(
                "identificador".into(),
                "a.user".into(),
            ))
            .with_header("content-type", "text/html; charset=utf-8")
            .with_body(body)
            .create();
        post_login_to(&Client::new(), &server.url(), "a.user", "pw").await
    }

    #[tokio::test]
    async fn login_accepted_when_clip_shows_the_home_page() {
        assert_eq!(post_login_answered_with(HOME).await, Ok(()));
    }

    #[tokio::test]
    async fn login_rejects_wrong_credentials() {
        let page = format!("<p>Autenticação inválida</p>{LOGIN_FORM}");
        assert_eq!(
            post_login_answered_with(&page).await,
            Err(INVALID_CREDENTIALS.to_string())
        );
    }

    #[tokio::test]
    async fn login_fails_when_clip_keeps_showing_the_login_form() {
        assert_eq!(
            post_login_answered_with(LOGIN_FORM).await,
            Err(LOGIN_FAILED.to_string())
        );
    }

    fn file_page(name: &str) -> String {
        format!(
            r#"<table><tr><td><a href="/objecto?oid=1&oin={name}">{name}</a></td><td>2026.09.14</td><td>1 Kb</td><td>Ana</td><td></td></tr></table>"#
        )
    }

    fn test_client() -> ClipClient {
        ClipClient {
            http: Client::new(),
            username: String::new(),
        }
    }

    #[tokio::test]
    async fn lists_files_from_every_page_in_order() {
        let mut server = mockito::Server::new_async().await;
        let _a = server
            .mock("GET", "/a")
            .with_body(file_page("a.pdf"))
            .create();
        let _b = server
            .mock("GET", "/b")
            .with_body(file_page("b.pdf"))
            .create();
        let pages = vec![
            (format!("{}/a", server.url()), "Problemas"),
            (format!("{}/b", server.url()), "Outros"),
        ];
        let files = files_on_pages(&test_client(), pages).await.unwrap();
        let got: Vec<_> = files
            .iter()
            .map(|f| (f.name.as_str(), f.type_name.as_str()))
            .collect();
        assert_eq!(got, [("a.pdf", "Problemas"), ("b.pdf", "Outros")]);
    }

    #[tokio::test]
    async fn listing_fails_when_a_page_fails() {
        let mut server = mockito::Server::new_async().await;
        let _a = server
            .mock("GET", "/a")
            .with_body(file_page("a.pdf"))
            .create();
        let _b = server.mock("GET", "/b").with_status(503).create();
        let pages = vec![
            (format!("{}/a", server.url()), "Problemas"),
            (format!("{}/b", server.url()), "Outros"),
        ];
        assert_eq!(
            files_on_pages(&test_client(), pages).await.unwrap_err(),
            "O CLIP respondeu com um erro (503)"
        );
    }

    #[test]
    fn home_page_must_list_students() {
        assert_eq!(students_from_home(HOME).unwrap()["Ana Silva"], "123");
        assert_eq!(
            students_from_home("<html>Bem-vindo</html>"),
            Err(NO_STUDENT_DATA.to_string())
        );
        assert_eq!(
            students_from_home(LOGIN_FORM),
            Err(LOGIN_FAILED.to_string())
        );
    }
}
