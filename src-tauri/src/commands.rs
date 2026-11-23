use std::collections::HashMap;
use std::io::{Cursor, Write};
use std::sync::Arc;

use base64::{engine::general_purpose::STANDARD, Engine};
use keyring::Entry;
use reqwest::Client;
use reqwest_cookie_store::{CookieStore, CookieStoreMutex};
use tauri::{command, State};
use uuid::Uuid;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

use crate::cache::{CacheHandler, APP_NAME};
use crate::constants::{CLIP_BASE, CLIP_HOME, FILE_TYPES, USER_AGENT};
use crate::parser::{
    extract_aluno_ids, extract_student_info, file_name_from_href, parse_chairs, parse_file_urls,
    parse_files, parse_schedule, parse_tests,
};
use crate::session::{fetch, get_session, ClipClient};
use crate::types::{
    ChairsResponse, CourseFile, FileParams, FileResponse, LoginResponse, Schedule, StudentInfo,
    Test,
};
use crate::url::Url;
use crate::utils::{decode_latin1, get_type_name};
use crate::{AppState, Session};

type VecThr<T> = Vec<tokio::task::JoinHandle<T>>;

const INVALID_CREDENTIALS: &str = "Login Error - Invalid Credentials";

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

#[command]
pub fn forget_login() {
    forget_credentials();
}

async fn authenticate(
    state: &State<'_, AppState>,
    username: &str,
    password: &str,
) -> Result<LoginResponse, String> {
    let client = Client::builder()
        .cookie_provider(Arc::new(CookieStoreMutex::new(CookieStore::default())))
        .user_agent(USER_AGENT)
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| e.to_string())?;

    post_login(&client, username, password).await?;

    let session_id = Uuid::new_v4().to_string();

    let home = client
        .get(CLIP_HOME)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let home_html = home.text().await.map_err(|e| e.to_string())?;

    // Extract aluno IDs from the home page
    let aluno_ids = extract_aluno_ids(&home_html);

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

/// Logs `client` into CLIP; its cookie store then holds the new session.
pub(crate) async fn post_login(
    client: &Client,
    username: &str,
    password: &str,
) -> Result<(), String> {
    let mut form_data = HashMap::new();
    form_data.insert("identificador", username);
    form_data.insert("senha", password);

    let response = client
        .post(CLIP_HOME)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .form(&form_data)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err("Login Failed - Clip Error".to_string());
    }
    let html = response.text().await.map_err(|e| e.to_string())?;
    if html.contains("Autenticação inválida") {
        return Err(INVALID_CREDENTIALS.to_string());
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
    let (client, _) = get_session(&state, &session_id)?;

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
        Err("Failed to parse student information".to_string())
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
    let (client, _) = get_session(&state, &session_id)?;

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
    let (client, _) = get_session(&state, &session_id)?;

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
    let (client, _) = get_session(&state, &params.session_id)?;

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
                Ok(bytes) => decode_latin1(&bytes),
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
            error: Some(format!("{} has no files", folder_name)),
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
    cache: State<'_, CacheHandler>,
    params: FileParams,
    student_id: String,
) -> Result<Vec<CourseFile>, String> {
    let (client, _) = get_session(&state, &params.session_id)?;

    let handles: VecThr<Vec<CourseFile>> = FILE_TYPES
        .iter()
        .map(|(code, name)| {
            let (client, cache) = (client.clone(), cache.inner().clone());
            let url = Url::documents(
                &student_id,
                &params.year,
                &params.period,
                &params.type_period,
                &params.unit_id,
                code,
            );
            tokio::spawn(async move {
                // CLIP file links expire with the session, so cached pages yield 404s
                let html = cache.put(&url, &client).await.unwrap_or_default();
                parse_files(&html, name)
            })
        })
        .collect();

    let mut files = Vec::new();
    for h in handles {
        files.extend(h.await.unwrap_or_default());
    }
    Ok(files)
}

#[command]
pub async fn download_file(
    state: State<'_, AppState>,
    session_id: String,
    href: String,
) -> Result<FileResponse, String> {
    let (client, _) = get_session(&state, &session_id)?;

    // Only CLIP document links: keeps the authenticated client off arbitrary URLs
    if !href.starts_with('/') || !href.contains("/objecto?") {
        return Err("Invalid file link".to_string());
    }

    let bytes = fetch(&client, &format!("{}{}", CLIP_BASE, href)).await?;

    Ok(FileResponse {
        success: true,
        data: Some(STANDARD.encode(&bytes)),
        filename: Some(file_name_from_href(&href)),
        error: None,
    })
}

#[command]
pub async fn get_schedule(
    state: State<'_, AppState>,
    cache: State<'_, CacheHandler>,
    session_id: String,
    student_id: Option<String>,
    year: Option<String>,
    period: Option<String>,
    use_cache: Option<bool>,
) -> Result<Schedule, String> {
    let (client, student_ids) = get_session(&state, &session_id)?;

    let resolved_id = student_id
        .as_deref()
        .or_else(|| student_ids.values().next().map(|s| s.as_str()))
        .ok_or("There is no student id")?
        .to_string();

    let url = Url::schedule(&resolved_id, year.as_deref(), period.as_deref());

    let html = if use_cache.unwrap_or(true) {
        cache.get(&url, &client).await?
    } else {
        cache.put(&url, &client).await?
    };

    parse_schedule(&html)
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
    let (client, _) = get_session(&state, &session_id)?;
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
