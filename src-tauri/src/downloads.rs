// Saving downloads to disk: safe file names, and names that don't overwrite.

use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager};

use crate::errors::{DOWNLOADS_UNAVAILABLE, SAVE_FAILED};

/// The user's downloads folder, where every download goes.
pub fn downloads_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().download_dir().map_err(|e| {
        log::warn!("No downloads folder: {e}");
        DOWNLOADS_UNAVAILABLE.to_string()
    })?;
    std::fs::create_dir_all(&dir).map_err(|e| {
        log::warn!("Cannot create {}: {e}", dir.display());
        DOWNLOADS_UNAVAILABLE.to_string()
    })?;
    Ok(dir)
}

/// Writes `data` as a new file named after `name` in `dir`, and returns its path.
pub fn save_new_file(dir: &Path, name: &str, data: &[u8]) -> Result<PathBuf, String> {
    let path = unique_path(dir, name);
    std::fs::write(&path, data).map_err(|e| {
        log::warn!("Cannot write {}: {e}", path.display());
        SAVE_FAILED.to_string()
    })?;
    Ok(path)
}

/// `name` made safe as a file name on every OS: no path separators or characters Windows
/// forbids, no `..`, no trailing dots or spaces, no reserved device names, and never empty.
pub fn sanitize_file_name(name: &str) -> String {
    let cleaned: String = name
        .chars()
        .map(|c| match c {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '_',
            c if c.is_control() => '_',
            c => c,
        })
        .collect();
    let cleaned = cleaned.trim().trim_end_matches(['.', ' ']).to_string();
    if cleaned.is_empty() || cleaned.chars().all(|c| c == '.') {
        return "ficheiro".to_string();
    }
    let stem = cleaned.split('.').next().unwrap_or("").to_ascii_uppercase();
    let reserved = matches!(stem.as_str(), "CON" | "PRN" | "AUX" | "NUL")
        || (stem.len() == 4
            && (stem.starts_with("COM") || stem.starts_with("LPT"))
            && stem.as_bytes()[3].is_ascii_digit());
    if reserved {
        format!("_{cleaned}")
    } else {
        cleaned
    }
}

/// "name (n).ext", or "name (n)" without an extension.
fn numbered(name: &str, n: usize) -> String {
    match name.rfind('.') {
        Some(dot) if dot > 0 => format!("{} ({n}){}", &name[..dot], &name[dot..]),
        _ => format!("{name} ({n})"),
    }
}

/// A path for `name` in `dir` that doesn't exist yet, numbering the name as browsers do.
pub fn unique_path(dir: &Path, name: &str) -> PathBuf {
    let name = sanitize_file_name(name);
    let mut path = dir.join(&name);
    let mut n = 1;
    while path.exists() {
        path = dir.join(numbered(&name, n));
        n += 1;
    }
    path
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sanitizes_file_names() {
        assert_eq!(sanitize_file_name("Aula 1.pdf"), "Aula 1.pdf");
        assert_eq!(sanitize_file_name("../../etc/passwd"), ".._.._etc_passwd");
        assert_eq!(sanitize_file_name("a\\b:c*?.pdf"), "a_b_c__.pdf");
        assert_eq!(sanitize_file_name("..."), "ficheiro");
        assert_eq!(sanitize_file_name("  "), "ficheiro");
        assert_eq!(sanitize_file_name("notas. "), "notas");
        assert_eq!(sanitize_file_name("tab\there"), "tab_here");
        assert_eq!(sanitize_file_name("con.txt"), "_con.txt");
        assert_eq!(sanitize_file_name("COM1"), "_COM1");
        assert_eq!(
            sanitize_file_name("Época – “Exame”.pdf"),
            "Época – “Exame”.pdf"
        );
    }

    #[test]
    fn numbers_paths_that_already_exist() {
        let dir = std::env::temp_dir().join(format!("flip-dl-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        assert_eq!(unique_path(&dir, "a.pdf"), dir.join("a.pdf"));
        std::fs::write(dir.join("a.pdf"), b"").unwrap();
        assert_eq!(unique_path(&dir, "a.pdf"), dir.join("a (1).pdf"));
        std::fs::write(dir.join("a (1).pdf"), b"").unwrap();
        assert_eq!(unique_path(&dir, "a.pdf"), dir.join("a (2).pdf"));
        assert_eq!(unique_path(&dir, "x/y"), dir.join("x_y"));
        std::fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn saves_without_overwriting() {
        let dir = std::env::temp_dir().join(format!("flip-dl-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let first = save_new_file(&dir, "a.pdf", b"one").unwrap();
        let second = save_new_file(&dir, "a.pdf", b"two").unwrap();
        assert_eq!(std::fs::read(first).unwrap(), b"one");
        assert_eq!(std::fs::read(second).unwrap(), b"two");
        std::fs::remove_dir_all(&dir).unwrap();
    }
}
