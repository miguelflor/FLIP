// Errors for the user, as codes the frontend translates (lib/i18n.ts, "error.<code>").
// A code may carry one value after a "|": "clip_http_error|503". Details for debugging go
// to the log instead.

pub const SESSION_EXPIRED: &str = "session_expired";
pub const CLIP_TIMEOUT: &str = "clip_timeout";
pub const CLIP_UNREACHABLE: &str = "clip_unreachable";
pub const INVALID_CREDENTIALS: &str = "invalid_credentials";
pub const LOGIN_FAILED: &str = "login_failed";
pub const CACHE_ERROR: &str = "cache_error";
pub const STUDENT_INFO_UNREADABLE: &str = "student_info_unreadable";
pub const SCHEDULE_UNREADABLE: &str = "schedule_unreadable";
pub const INVALID_FILE_LINK: &str = "invalid_file_link";
pub const UNKNOWN_STUDENT: &str = "unknown_student";
pub const DOWNLOAD_CANCELLED: &str = "download_cancelled";
pub const SETTINGS_SAVE_FAILED: &str = "settings_save_failed";
pub const SAVE_FAILED: &str = "save_failed";
pub const ZIP_EMPTY: &str = "zip_empty";
pub const INVALID_PERIOD: &str = "invalid_period";
pub const NO_STUDENT_DATA: &str = "no_student_data";

/// A failed request to CLIP, as an error for the user.
pub fn net_error(e: reqwest::Error) -> String {
    log::warn!("CLIP request failed: {e}");
    if e.is_timeout() {
        CLIP_TIMEOUT
    } else {
        CLIP_UNREACHABLE
    }
    .to_string()
}

/// CLIP answered `url` with an error status.
pub fn http_error(url: &str, status: reqwest::StatusCode) -> String {
    log::warn!("CLIP answered {url} with {status}");
    format!("clip_http_error|{}", status.as_u16())
}

/// A unit with no files to download.
pub fn no_files(unit: &str) -> String {
    format!("no_files|{unit}")
}
