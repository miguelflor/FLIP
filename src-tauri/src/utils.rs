use crate::constants::{
    CLIP_HOME, FILE_TYPES, PERIOD_N, PERIOD_TYPE, STUDENT, TYPE_FILE, UNIDADE, YEAR,
};

// ============================================================================
// Utility Functions
// ============================================================================

pub fn build_clip_year_student_url(year: &str, student: &str) -> String {
    format!(
        "{}/aluno/ano_lectivo?aluno={}&ano_lectivo={}",
        CLIP_HOME, student, year
    )
}

pub fn build_docs_url(
    student: &str,
    year: &str,
    period: &str,
    type_period: &str,
    unit_id: &str,
    doc_type: &str,
) -> String {
    format!(
        "{}/aluno/ano_lectivo/unidades/unidade_curricular/actividade/documentos?{}={}&{}={}&{}={}&{}={}&{}={}&{}={}",
        CLIP_HOME, PERIOD_N, period, PERIOD_TYPE, type_period, YEAR, year,STUDENT,student, UNIDADE, unit_id, TYPE_FILE, doc_type
    )
}

pub fn get_type_name(type_code: &str) -> &str {
    FILE_TYPES
        .iter()
        .find(|(code, _)| *code == type_code)
        .map(|(_, name)| *name)
        .unwrap_or("Desconhecido")
}

pub fn decode_latin1(bytes: &[u8]) -> String {
    bytes.iter().map(|&b| b as char).collect()
}
