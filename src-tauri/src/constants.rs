// ============================================================================
// Constants
// ============================================================================

use const_format::concatcp;

pub const CLIP_BASE: &str = "https://clip.fct.unl.pt";
pub const CLIP_HOME: &str = "https://clip.fct.unl.pt/utente/eu";
pub const CLIP_SCHEDULE: &str = concatcp!(CLIP_HOME, "/aluno/ano_lectivo/hor%E1rio");
pub const USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

// URL parameter names (URL-encoded)
pub const PERIOD_N: &str = "per%EDodo_lectivo";
pub const PERIOD_TYPE: &str = "tipo_de_per%EDodo_lectivo";
pub const TYPE_FILE: &str = "tipo_de_documento_de_unidade";
pub const YEAR: &str = "ano_lectivo";
pub const UNIDADE: &str = "unidade";
pub const STUDENT: &str = "aluno";

// CLIP details
pub const N_ROWS_SCHEDULE_TABLE: usize = 32;

// File types
pub const FILE_TYPES: &[(&str, &str)] = &[
    ("0ac", "Multimedia"),
    ("1e", "Problemas"),
    ("2tr", "Protocolos"),
    ("3sm", "Seminarios"),
    ("ex", "Exames"),
    ("t", "Testes"),
    ("ta", "Textos_de_Apoio"),
    ("xot", "Outros"),
];

pub const SEMESTER_URL_TYPE: &str = "s";
pub const TRIMESTER_URL_TYPE: &str = "t";
