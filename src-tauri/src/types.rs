use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::constants::{SEMESTER_URL_TYPE, TRIMESTER_URL_TYPE};

// ============================================================================
// Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginResponse {
    pub session_id: String,
    pub aluno_ids: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StudentInfo {
    pub photo_data: Option<String>,
    pub student_name: String,
    pub course: String,
}

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

#[derive(Debug)]
pub enum Semester {
    First,
    MidYear,
    Second,
}
impl Semester {
    pub fn url_type(&self) -> &str {
        match self {
            Semester::First | Semester::Second => SEMESTER_URL_TYPE,
            Semester::MidYear => TRIMESTER_URL_TYPE,
        }
    }

    pub fn url_num(&self) -> &str {
        match self {
            Semester::First | Semester::MidYear => "1",
            Semester::Second => "2",
        }
    }
}
