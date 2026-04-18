use std::collections::HashMap;
use std::io::{Cursor, Write};
use std::sync::Arc;

use base64::{engine::general_purpose::STANDARD, Engine};
use reqwest::Client;
use reqwest_cookie_store::{CookieStore, CookieStoreMutex};
use scraper::{Html, Selector};
use tauri::{command, State};
use uuid::Uuid;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

use crate::constants::{CLIP_BASE, CLIP_HOME, FILE_TYPES, N_ROWS_SCHEDULE_TABLE, USER_AGENT};
use crate::parser::{
    extract_aluno_ids, extract_student_info, parse_chairs, parse_file_urls, ParsedStudentInfo,
};
use crate::session::get_session;
use crate::types::{
    ChairsResponse, FileParams, FileResponse, LoginResponse, Schedule, StudentInfo,
};
use crate::utils::{
    build_clip_schedule, build_clip_year_student_url, build_docs_url, decode_latin1, get_type_name,
};
use crate::{AppState, Session};

#[command]
pub async fn login(
    state: State<'_, AppState>,
    username: String,
    password: String,
) -> Result<LoginResponse, String> {
    let cookie_store = Arc::new(CookieStoreMutex::new(CookieStore::default()));

    let client = Client::builder()
        .cookie_provider(cookie_store.clone())
        .user_agent(USER_AGENT)
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| e.to_string())?;

    let mut form_data = HashMap::new();
    form_data.insert("identificador".to_string(), username);
    form_data.insert("senha".to_string(), password);

    // Step 1: Submit login
    let login_response = client
        .post(CLIP_HOME)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .form(&form_data)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if login_response.status().is_success() {
        let html = login_response.text().await.unwrap();
        if html.contains("Autenticação inválida") {
            return Err("Login Error - Invalid Credentials".to_string());
        }
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
            client,
            cookie_store,
            aluno_ids: aluno_ids.clone(),
        };

        let session_id_copy = session_id.clone();
        state.sessions.lock().insert(session_id, session);

        Ok(LoginResponse {
            session_id: session_id_copy,
            aluno_ids,
        })
    } else {
        Err("Login Failed - Clip Error".to_string())
    }
}

#[command]
pub async fn get_student_info(
    state: State<'_, AppState>,
    session_id: String,
    student_id: String,
) -> Result<StudentInfo, String> {
    let (client, _) = get_session(&state, &session_id)?;

    let url = format!(
        "https://clip.fct.unl.pt/utente/eu/aluno?aluno={}",
        student_id
    );

    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to fetch student info: {}",
            response.status()
        ));
    }

    let html_bytes = response.bytes().await.map_err(|e| e.to_string())?;
    let html = decode_latin1(&html_bytes);

    // Extract student info from HTML
    if let Some(parsed_info) = extract_student_info(&html) {
        // Fetch the photo image and convert to base64
        let photo_data = match client.get(&parsed_info.photo_url).send().await {
            Ok(img_response) => match img_response.bytes().await {
                Ok(img_bytes) => Some(STANDARD.encode(&img_bytes)),
                Err(_) => None,
            },
            Err(_) => None,
        };

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
    session_id: String,
    student_id: String,
    year: String,
) -> Result<ChairsResponse, String> {
    let (client, _) = get_session(&state, &session_id)?;

    let url = build_clip_year_student_url(&year, student_id.as_str());

    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Ok(ChairsResponse {
            success: false,
            chairs: None,
            error: Some(format!("Failed to fetch chairs: {}", response.status())),
        });
    }

    let html_bytes = response.bytes().await.map_err(|e| e.to_string())?;
    let html = decode_latin1(&html_bytes);

    // Parse outside of async context
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
    session_id: String,
    student_id: String,
) -> Result<serde_json::Value, String> {
    let (client, _) = get_session(&state, &session_id)?;

    let url = format!(
        "https://clip.fct.unl.pt/utente/eu/aluno/ano_lectivo?aluno={}&instituição=97747",
        student_id
    );

    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;

    let body = response.text().await.map_err(|e| e.to_string())?;
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
    let mut handles: Vec<tokio::task::JoinHandle<Vec<(String, Vec<u8>)>>> = Vec::new();

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

            let url = build_docs_url(
                &student_id,
                &params_year,
                &params_period,
                &params_type_period,
                &params_unit_id,
                &type_code,
            );

            println!("{}", url.to_string());

            let response = match client.get(&url).send().await {
                Ok(r) => r,
                Err(_) => return files,
            };

            if !response.status().is_success() {
                return files;
            }

            let html = response.text().await.unwrap_or_default();
            // std::fs::write("output.html", &html).expect("Could not write file");
            let file_urls = parse_file_urls(&html);
            let type_folder = format!("{}/{}", folder_name, get_type_name(&type_code));

            // Spawn a subtask per file
            let mut file_handles: Vec<tokio::task::JoinHandle<Option<(String, Vec<u8>)>>> =
                Vec::new();

            for href in file_urls {
                let client = client.clone();
                let type_folder = type_folder.clone();
                let href = href.clone();

                let file_handle = tokio::spawn(async move {
                    let file_url = format!("{}{}", CLIP_BASE, href);
                    let file_response = match client.get(&file_url).send().await {
                        Ok(r) => r,
                        Err(_) => return None,
                    };

                    if !file_response.status().is_success() {
                        return None;
                    }

                    let filename = href.split('=').next_back().unwrap_or("unknown");
                    let file_data = match file_response.bytes().await {
                        Ok(b) => b,
                        Err(_) => return None,
                    };

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
pub async fn get_shedule(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<Schedule, String> {
    let (client, student_ids) = get_session(&state, &session_id)?;
    let first_id = student_ids.values().next();

    let url = build_clip_schedule(first_id.ok_or("There is no student id")?);
    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err("The CLIP is working ...".to_string());
    }

    let html_bytes = res.bytes().await.map_err(|e| e.to_string())?;
    let html = decode_latin1(&html_bytes);
    let doc = Html::parse_document(&html);
    let table_selector = Selector::parse("table").unwrap();

    let html_schedule = doc
        .select(&table_selector)
        .find(|t| t.select(&Selector::parse("tr").unwrap()).count() == N_ROWS_SCHEDULE_TABLE);
    


    todo!()
}
