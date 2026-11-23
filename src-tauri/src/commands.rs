use std::collections::HashMap;
use std::io::{Seek, Write};
use std::sync::Arc;

use keyring::Entry;
use reqwest::Client;
use tauri::{command, AppHandle, State};
use tokio::sync::Semaphore;
use tokio::task::JoinSet;
use uuid::Uuid;
use zip::write::SimpleFileOptions;
use zip::{CompressionMethod, ZipWriter};

use crate::cache::{CacheHandler, APP_NAME};
use crate::constants::{CLIP_BASE, CLIP_HOME, FILE_TYPES};
use crate::downloads::{downloads_dir, save_new_file, unique_path, ZipNames};
use crate::errors::{
    http_error, net_error, INVALID_CREDENTIALS, INVALID_FILE_LINK, LOGIN_FAILED, NO_STUDENT_DATA,
    SAVE_FAILED, SCHEDULE_UNREADABLE, STUDENT_INFO_UNREADABLE, ZIP_EMPTY,
};
use crate::parser::{
    extract_aluno_ids, extract_student_info, file_name_from_href, parse_chairs, parse_files,
    parse_schedule, parse_tests,
};
use crate::session::{
    fetch, get_session, get_student_session, is_login_page, new_http_client, ClipClient,
};
use crate::types::{
    ChairsResponse, CourseDownload, CourseFile, FileParams, FileRef, LoginResponse, Schedule,
    StudentInfo, Test,
};
use crate::url::Url;
use crate::utils::decode_clip_text;
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
        client: ClipClient::new(client, username),
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

/// How many files of a unit are fetched from CLIP at once.
const PARALLEL_DOWNLOADS: usize = 4;

/// Downloads the given files of a unit (as listed by list_files) into one ZIP in the
/// downloads folder, a folder per file type. Files that fail are left out and counted.
#[command]
pub async fn download_course(
    app: AppHandle,
    state: State<'_, AppState>,
    session_id: String,
    name: String,
    year: String,
    files: Vec<FileRef>,
) -> Result<CourseDownload, String> {
    let (client, _) = get_session(&state, &session_id)?;
    if files.is_empty() {
        return Err(format!("{name} não tem ficheiros"));
    }
    // Only CLIP document links: keeps the authenticated client off arbitrary URLs
    if !files.iter().all(|f| is_clip_file_link(&f.href)) {
        return Err(INVALID_FILE_LINK.to_string());
    }

    let folder = format!("{year}-{name}");
    let path = unique_path(&downloads_dir(&app)?, &format!("{folder}.zip"));
    let file = std::fs::File::create(&path).map_err(|e| {
        log::warn!("Cannot create {}: {e}", path.display());
        SAVE_FAILED.to_string()
    })?;

    match zip_files(&client, CLIP_BASE, &folder, files, file).await {
        Ok(zipped) if zipped.saved > 0 => Ok(CourseDownload {
            path: path.display().to_string(),
            saved: zipped.saved,
            failed: zipped.failed,
        }),
        // Nothing saved: no empty ZIP is left behind, and the error says why
        other => {
            let _ = std::fs::remove_file(&path);
            Err(match other {
                Ok(zipped) => zipped.first_error.unwrap_or_else(|| ZIP_EMPTY.to_string()),
                Err(e) => e,
            })
        }
    }
}

struct Zipped {
    saved: usize,
    failed: usize,
    first_error: Option<String>,
}

/// Fetches `files` from `base`, a few at a time, writing each into a ZIP on `out` as it
/// arrives, under "folder/type/name". Only the files being fetched are held in memory.
async fn zip_files<W: Write + Seek>(
    client: &ClipClient,
    base: &str,
    folder: &str,
    files: Vec<FileRef>,
    out: W,
) -> Result<Zipped, String> {
    // Entry names are given out in list order, so duplicates are numbered predictably.
    let mut names = ZipNames::default();
    let slots = Arc::new(Semaphore::new(PARALLEL_DOWNLOADS));
    let mut downloads = JoinSet::new();
    for file in files {
        let entry = names.entry(&[folder, &file.type_name], &file_name_from_href(&file.href));
        let (client, slots) = (client.clone(), slots.clone());
        let url = format!("{base}{}", file.href);
        downloads.spawn(async move {
            let _slot = slots.acquire_owned().await;
            (entry, fetch(&client, &url).await)
        });
    }

    let write_error = |e: zip::result::ZipError| {
        log::warn!("Cannot write ZIP: {e}");
        SAVE_FAILED.to_string()
    };
    let options = SimpleFileOptions::default().compression_method(CompressionMethod::Deflated);
    let mut zip = ZipWriter::new(out);
    let mut zipped = Zipped {
        saved: 0,
        failed: 0,
        first_error: None,
    };
    while let Some(done) = downloads.join_next().await {
        match done
            .map_err(|e| e.to_string())
            .and_then(|(entry, data)| Ok((entry, data?)))
        {
            Ok((entry, data)) => {
                zip.start_file(entry, options).map_err(write_error)?;
                zip.write_all(&data).map_err(|e| write_error(e.into()))?;
                zipped.saved += 1;
            }
            Err(e) => {
                log::warn!("File left out of ZIP: {e}");
                zipped.failed += 1;
                zipped.first_error.get_or_insert(e);
            }
        }
    }
    zip.finish().map_err(write_error)?;
    Ok(zipped)
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
        ClipClient::new(Client::new(), "")
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

    fn file_ref(oid: &str, name: &str, type_name: &str) -> FileRef {
        FileRef {
            href: format!("/objecto?oid={oid}&oin={name}"),
            type_name: type_name.to_string(),
        }
    }

    async fn serve_objects(
        server: &mut mockito::Server,
        objects: &[(&str, Result<&str, usize>)],
    ) -> Vec<mockito::Mock> {
        let mut mocks = Vec::new();
        for (oid, answer) in objects {
            let mock = server
                .mock("GET", "/objecto")
                .match_query(mockito::Matcher::UrlEncoded("oid".into(), oid.to_string()));
            mocks.push(match answer {
                Ok(body) => mock.with_body(*body).create(),
                Err(status) => mock.with_status(*status).create(),
            });
        }
        mocks
    }

    #[tokio::test]
    async fn zips_files_by_type_numbering_duplicates_and_skipping_failures() {
        let mut server = mockito::Server::new_async().await;
        let _m = serve_objects(
            &mut server,
            &[
                ("1", Ok("one")),
                ("2", Ok("two")),
                ("3", Err(500)),
                ("4", Ok("four")),
            ],
        )
        .await;
        let files = vec![
            file_ref("1", "a.pdf", "Outros"),
            file_ref("2", "a.pdf", "Outros"),
            file_ref("3", "b.pdf", "Outros"),
            file_ref("4", "a.pdf", "Testes"),
        ];

        let mut out = std::io::Cursor::new(Vec::new());
        let zipped = zip_files(&test_client(), &server.url(), "2026-Redes", files, &mut out)
            .await
            .unwrap();
        assert_eq!((zipped.saved, zipped.failed), (3, 1));
        assert_eq!(
            zipped.first_error.as_deref(),
            Some("O CLIP respondeu com um erro (500)")
        );

        let mut archive = zip::ZipArchive::new(out).unwrap();
        let mut entries = HashMap::new();
        for i in 0..archive.len() {
            let mut entry = archive.by_index(i).unwrap();
            let mut body = String::new();
            std::io::Read::read_to_string(&mut entry, &mut body).unwrap();
            entries.insert(entry.name().to_string(), body);
        }
        assert_eq!(
            entries,
            HashMap::from([
                ("2026-Redes/Outros/a.pdf".to_string(), "one".to_string()),
                ("2026-Redes/Outros/a (2).pdf".to_string(), "two".to_string()),
                ("2026-Redes/Testes/a.pdf".to_string(), "four".to_string()),
            ])
        );
    }

    #[tokio::test]
    async fn zip_fetches_at_most_a_few_files_at_once() {
        use std::sync::atomic::{AtomicUsize, Ordering::SeqCst};
        use tokio::io::{AsyncReadExt, AsyncWriteExt};

        // Answers every request after a pause, recording how many it was serving at once.
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        let (now, peak) = (Arc::new(AtomicUsize::new(0)), Arc::new(AtomicUsize::new(0)));
        let (now_s, peak_s) = (now.clone(), peak.clone());
        tokio::spawn(async move {
            loop {
                let (mut socket, _) = listener.accept().await.unwrap();
                let (now, peak) = (now_s.clone(), peak_s.clone());
                tokio::spawn(async move {
                    let mut buf = [0u8; 1024];
                    let _ = socket.read(&mut buf).await;
                    peak.fetch_max(now.fetch_add(1, SeqCst) + 1, SeqCst);
                    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
                    now.fetch_sub(1, SeqCst);
                    let _ = socket
                        .write_all(
                            b"HTTP/1.1 200 OK\r\ncontent-length: 1\r\nconnection: close\r\n\r\nx",
                        )
                        .await;
                });
            }
        });

        let files = (0..12)
            .map(|i| file_ref(&i.to_string(), &format!("{i}.pdf"), "Outros"))
            .collect();
        let zipped = zip_files(
            &test_client(),
            &format!("http://{addr}"),
            "x",
            files,
            std::io::Cursor::new(Vec::new()),
        )
        .await
        .unwrap();
        assert_eq!(zipped.saved, 12);
        let peak = peak.load(SeqCst);
        assert!(
            peak > 1 && peak <= PARALLEL_DOWNLOADS,
            "peak of {peak} at once"
        );
    }

    #[tokio::test]
    async fn zip_reports_why_nothing_was_saved() {
        let mut server = mockito::Server::new_async().await;
        let _m = serve_objects(&mut server, &[("1", Err(404))]).await;
        let mut out = std::io::Cursor::new(Vec::new());
        let zipped = zip_files(
            &test_client(),
            &server.url(),
            "x",
            vec![file_ref("1", "a.pdf", "Outros")],
            &mut out,
        )
        .await
        .unwrap();
        assert_eq!((zipped.saved, zipped.failed), (0, 1));
        assert_eq!(
            zipped.first_error.as_deref(),
            Some("O CLIP respondeu com um erro (404)")
        );
    }

    #[test]
    fn only_clip_file_links_are_fetched() {
        assert!(is_clip_file_link("/objecto?oid=1&oin=a.pdf"));
        assert!(!is_clip_file_link("https://evil.example/objecto?oid=1"));
        assert!(!is_clip_file_link("/utente/eu/aluno"));
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
