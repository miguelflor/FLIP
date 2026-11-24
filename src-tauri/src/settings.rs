// The user's preferences, kept as JSON in the app's config folder.

use std::path::{Path, PathBuf};

use parking_lot::Mutex;
use serde::{Deserialize, Serialize};

#[derive(Debug, Default, Clone, PartialEq, Serialize, Deserialize)]
pub struct Settings {
    /// Where downloads and exports are saved; asked for on the first one.
    pub download_dir: Option<PathBuf>,
}

/// The language the frontend shows ("pt-PT" or "en"), for the little text the backend
/// draws itself, such as the folder picker's title.
#[derive(Default)]
pub struct UiLanguage(pub Mutex<String>);

impl UiLanguage {
    pub fn is_portuguese(&self) -> bool {
        self.0.lock().starts_with("pt")
    }
}

pub struct SettingsStore {
    path: PathBuf,
    settings: Mutex<Settings>,
}

impl SettingsStore {
    /// Loads the settings at `path`; missing or unreadable ones start from the defaults.
    pub fn load(path: PathBuf) -> Self {
        let settings = std::fs::read_to_string(&path)
            .ok()
            .and_then(|json| serde_json::from_str(&json).ok())
            .unwrap_or_default();
        Self {
            path,
            settings: Mutex::new(settings),
        }
    }

    pub fn get(&self) -> Settings {
        self.settings.lock().clone()
    }

    /// Changes the settings and writes them to disk.
    pub fn update(&self, change: impl FnOnce(&mut Settings)) -> Result<(), String> {
        let mut settings = self.settings.lock();
        change(&mut settings);
        write(&self.path, &settings).map_err(|e| {
            log::warn!("Cannot save settings to {}: {e}", self.path.display());
            crate::errors::SETTINGS_SAVE_FAILED.to_string()
        })
    }
}

fn write(path: &Path, settings: &Settings) -> std::io::Result<()> {
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir)?;
    }
    std::fs::write(path, serde_json::to_string_pretty(settings)?)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_path() -> PathBuf {
        std::env::temp_dir()
            .join(format!("flip-settings-{}", uuid::Uuid::new_v4()))
            .join("settings.json")
    }

    #[test]
    fn starts_from_defaults_without_a_file() {
        assert_eq!(SettingsStore::load(temp_path()).get(), Settings::default());
    }

    #[test]
    fn keeps_changes_across_restarts() {
        let path = temp_path();
        let store = SettingsStore::load(path.clone());
        store
            .update(|s| s.download_dir = Some(PathBuf::from("/home/ana/Aulas")))
            .unwrap();

        let reloaded = SettingsStore::load(path.clone());
        assert_eq!(
            reloaded.get().download_dir,
            Some(PathBuf::from("/home/ana/Aulas"))
        );
        std::fs::remove_dir_all(path.parent().unwrap()).unwrap();
    }

    #[test]
    fn ignores_an_unreadable_file() {
        let path = temp_path();
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(&path, "{ not json").unwrap();
        assert_eq!(SettingsStore::load(path.clone()).get(), Settings::default());
        std::fs::remove_dir_all(path.parent().unwrap()).unwrap();
    }
}
