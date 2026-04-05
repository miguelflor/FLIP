use std::collections::HashMap;
use std::fs;
use std::io::{Cursor, Write};
use std::sync::Arc;

use base64::{engine::general_purpose::STANDARD, Engine};
use reqwest::Client;
use reqwest_cookie_store::{CookieStore, CookieStoreMutex};
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use tauri::{command, State};
use uuid::Uuid;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

use crate::{AppState, Session};

// ============================================================================
// Constants
// ============================================================================

const CLIP_URL: &str = "https://clip.fct.unl.pt";
const CLIP_HOME: &str = "https://clip.fct.unl.pt/utente/eu";
const USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

// URL parameter names (URL-encoded)
const PERIOD_N: &str = "per%EDodo_lectivo";
const PERIOD_TYPE: &str = "tipo_de_per%EDodo_lectivo";
const TYPE_FILE: &str = "tipo_de_documento_de_unidade";
const YEAR: &str = "ano_lectivo";
const UNIDADE: &str = "unidade";

// File types
const FILE_TYPES: &[(&str, &str)] = &[
    ("0ac", "Multimedia"),
    ("1e", "Problemas"),
    ("2tr", "Protocolos"),
    ("3sm", "Seminarios"),
    ("ex", "Exames"),
    ("t", "Testes"),
    ("ta", "Textos_de_Apoio"),
    ("xot", "Outros"),
];

// ============================================================================
// Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chair {
    pub href: String,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChairsByPeriod {
    pub s1: Vec<Chair>,
    pub s2: Vec<Chair>,
    pub t1: Vec<Chair>,
    pub t2: Vec<Chair>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub session_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChairsResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub chairs: Option<ChairsByPeriod>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub filename: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileParams {
    pub session_id: String,
    pub period: String,
    pub unit_id: String,
    pub file_type: String,
    pub name: String,
    pub year: String,
    pub type_period: String,
}

// ============================================================================
// Helper Functions
// ============================================================================

fn get_current_academic_year() -> String {
    use chrono::{Datelike, Local};
    let now = Local::now();
    let year = if now.month() >= 9 {
        now.year() + 1
    } else {
        now.year()
    };
    year.to_string()
}

fn build_clip_year_student_url(year: &str, student: &str) -> String {
    format!("{}/aluno/ano_lectivo?aluno={}&ano_lectivo={}", CLIP_HOME,student, year)
}

fn build_docs_url(
    year: &str,
    period: &str,
    type_period: &str,
    unit_id: &str,
    doc_type: &str,
) -> String {
    format!(
        "{}/aluno/ano_lectivo/unidades/unidade_curricular/actividade/documentos?{}={}&{}={}&{}={}&{}={}&{}={}",
        CLIP_HOME, PERIOD_N, period, PERIOD_TYPE, type_period, YEAR, year, UNIDADE, unit_id, TYPE_FILE, doc_type
    )
}

fn get_type_name(type_code: &str) -> &str {
    FILE_TYPES
        .iter()
        .find(|(code, _)| *code == type_code)
        .map(|(_, name)| *name)
        .unwrap_or("Desconhecido")
}

fn decode_latin1(bytes: &[u8]) -> String {
    bytes.iter().map(|&b| b as char).collect()
}

fn extract_form_fields(html: &str) -> HashMap<String, String> {
    let document = Html::parse_document(html);
    let mut form_data: HashMap<String, String> = HashMap::new();
    let input_selector = Selector::parse("form input").unwrap();

    for element in document.select(&input_selector) {
        if let Some(name) = element.value().attr("name") {
            let value = element.value().attr("value").unwrap_or("");
            form_data.insert(name.to_string(), value.to_string());
        }
    }
    form_data
}

fn parse_chairs(html: &str) -> ChairsByPeriod {
    let document = Html::parse_document(html);

    fn get_chair_links(document: &Html, period_n: &str, period_type: &str) -> Vec<Chair> {
        let link_selector = Selector::parse("a[href]").unwrap();
        let mut chairs = Vec::new();

        for element in document.select(&link_selector) {
            if let Some(href) = element.value().attr("href") {
                if href.contains("&unidade=")
                    && href.contains(&format!("&{}={}", PERIOD_N, period_n))
                    && href.contains(&format!("&{}={}", PERIOD_TYPE, period_type))
                {
                    let text = element.text().collect::<String>().trim().to_string();
                    if !text.is_empty() {
                        chairs.push(Chair {
                            href: href.to_string(),
                            text,
                        });
                    }
                }
            }
        }
        chairs
    }

    ChairsByPeriod {
        s1: get_chair_links(&document, "1", "s"),
        s2: get_chair_links(&document, "2", "s"),
        t1: get_chair_links(&document, "1", "t"),
        t2: get_chair_links(&document, "2", "t"),
    }
}

fn parse_file_urls(html: &str) -> Vec<String> {
    let document = Html::parse_document(html);
    let link_selector = Selector::parse("a[href*='/objecto?']").unwrap();

    document
        .select(&link_selector)
        .filter_map(|element| element.value().attr("href").map(String::from))
        .collect()
}


fn extract_aluno_ids(html: &str) -> Vec<String> {
    let document = Html::parse_document(html);
    let link_selector = Selector::parse("a[href*='aluno']").unwrap();
    document
        .select(&link_selector)
        .filter_map(|element| {
            let href = element.value().attr("href")?;
            let query_part = href.split('?').nth(1).unwrap_or(href);

            for param in query_part.split('&') {
                if let Some(value) = param.strip_prefix("aluno=") {
                    return Some(value.split('&').next().unwrap_or(value).to_string());
                }
            }
            None
        })
        .collect()
}

// ============================================================================
// Tauri Commands
// ============================================================================

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

    // Step 1: Get login page
    let login_page = client
        .get(CLIP_HOME)
        .header("Referer", format!("{}/", CLIP_URL))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !login_page.status().is_success() {
        return Ok(LoginResponse {
            success: false,
            session_id: None,
            error: Some(format!(
                "Failed to load login page: {}",
                login_page.status()
            )),
        });
    }

    let html_bytes = login_page.bytes().await.map_err(|e| e.to_string())?;
    let html = decode_latin1(&html_bytes);

    // Extract form fields synchronously (no await after this)
    let mut form_data = extract_form_fields(&html);
    form_data.insert("identificador".to_string(), username);
    form_data.insert("senha".to_string(), password);

    // Step 2: Submit login
    let login_response = client
        .post(CLIP_HOME)
        .header("Referer", format!("{}/", CLIP_URL))
        .header("Content-Type", "application/x-www-form-urlencoded")
        .form(&form_data)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if login_response.status().is_success() {
        let session_id = Uuid::new_v4().to_string();

        let home = client
            .get(CLIP_HOME)
            .header("Referer", format!("{}/", CLIP_URL))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let home_html = home.text().await.map_err(|e| e.to_string())?;
        
        // Extract aluno IDs from the home page
        let aluno_ids = extract_aluno_ids(&home_html);

        let session = Session {
            client,
            cookie_store,
            aluno_ids,
        };

        state.sessions.lock().insert(session_id.clone(), session);

        Ok(LoginResponse {
            success: true,
            session_id: Some(session_id),
            error: None,
        })
    } else {
        Ok(LoginResponse {
            success: false,
            session_id: None,
            error: Some("Login failed - invalid credentials".to_string()),
        })
    }
}

#[command]
pub async fn get_chairs(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<ChairsResponse, String> {
    // Clone the client and aluno_ids out of the lock
    let (client, aluno_ids) = {
        let sessions = state.sessions.lock();
        match sessions.get(&session_id) {
            Some(s) => (s.client.clone(), s.aluno_ids.clone()),
            None => {
                return Ok(ChairsResponse {
                    success: false,
                    chairs: None,
                    error: Some("Session not found or expired".to_string()),
                });
            }
        }
    };

    // Now you have access to aluno_ids!
    println!("Available aluno IDs: {:?}", aluno_ids);
    if aluno_ids.is_empty() {
        return Ok(ChairsResponse {
            success: false,
            chairs: None,
            error: Some("The student ids can't be empty!".to_string()),
        });
    }

    let year = get_current_academic_year();
    let url = build_clip_year_student_url(&year,&aluno_ids[0].clone());

    let response = client
        .get(&url)
        .header("Referer", format!("{}/", CLIP_URL))
        .send()
        .await
        .map_err(|e| e.to_string())?;

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
pub async fn get_file(
    state: State<'_, AppState>,
    params: FileParams,
) -> Result<FileResponse, String> {
    let (client, _aluno_ids) = {
        let sessions = state.sessions.lock();
        match sessions.get(&params.session_id) {
            Some(s) => (s.client.clone(), s.aluno_ids.clone()),
            None => {
                return Ok(FileResponse {
                    success: false,
                    data: None,
                    filename: None,
                    error: Some("Session not found or expired".to_string()),
                });
            }
        }
    };

    let file_types: Vec<String> = if params.file_type == "all" {
        FILE_TYPES.iter().map(|(code, _)| code.to_string()).collect()
    } else {
        vec![params.file_type.clone()]
    };

    let year = get_current_academic_year();
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

        let handle = tokio::spawn(async move {
            let mut files: Vec<(String, Vec<u8>)> = Vec::new();

            let url = build_docs_url(
                &params_year,
                &params_period,
                &params_type_period,
                &params_unit_id,
                &type_code,
            );

            let response = match client
                .get(&url)
                .header("Referer", format!("{}/", CLIP_URL))
                .send()
                .await
            {
                Ok(r) => r,
                Err(_) => return files,
            };

            if !response.status().is_success() {
                return files;
            }

            let html = response.text().await.unwrap_or_default();
            let file_urls = parse_file_urls(&html);
            let type_folder = format!("{}/{}", folder_name, get_type_name(&type_code));

            for href in file_urls {
                let file_url = format!("{}{}", CLIP_URL, href);
                let file_response = match client
                    .get(&file_url)
                    .header("Referer", format!("{}/", CLIP_URL))
                    .send()
                    .await
                {
                    Ok(r) => r,
                    Err(_) => continue,
                };

                if !file_response.status().is_success() {
                    continue;
                }

                let filename = href.split('=').next_back().unwrap_or("unknown");
                let file_data = match file_response.bytes().await {
                    Ok(b) => b,
                    Err(_) => continue,
                };

                let zip_path = format!("{}/{}", type_folder, filename);
                files.push((zip_path, file_data.to_vec()));
            }

            files
        });

        handles.push(handle);
    }

    // Join all tasks and collect results
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
                }
            }
        }

        zip.finish().map_err(|e| e.to_string())?;
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
