use serde::{Deserialize, Serialize};

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
pub struct ChairsResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub chairs: Option<ChairsByPeriod>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CourseFile {
    pub name: String,
    pub type_name: String,
    pub href: String,
    pub date: String,
    pub size: String,
    pub uploader: String,
}

/// A test from CLIP's "Testes de avaliação" page.
#[derive(Debug, Clone, Serialize)]
pub struct Test {
    pub unit: String,
    pub name: String,
    /// "YYYY-MM-DD"
    pub date: String,
    /// "HH:MM"
    pub time: String,
    pub rooms: Vec<String>,
    /// False when the test is only open for enrollment.
    pub enrolled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileParams {
    pub session_id: String,
    pub period: String,
    pub unit_id: String,
    pub year: String,
    pub type_period: String,
}

/// A file to download, as list_files gave it.
#[derive(Debug, Clone, Deserialize)]
pub struct FileRef {
    pub href: String,
    pub type_name: String,
}

/// A unit's files saved as one ZIP.
#[derive(Debug, Clone, Serialize)]
pub struct CourseDownload {
    pub path: String,
    pub saved: usize,
    pub failed: usize,
}
