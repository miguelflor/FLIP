use serde::{Deserialize, Serialize};

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
