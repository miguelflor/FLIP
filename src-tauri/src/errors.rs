// Messages shown to the user. Details for debugging go to the log instead.

pub const SESSION_EXPIRED: &str = "Sessão expirada, inicie sessão novamente";
pub const CLIP_TIMEOUT: &str = "O CLIP demorou demasiado a responder. Tente novamente.";
pub const CLIP_UNREACHABLE: &str =
    "Não foi possível contactar o CLIP. Verifique a ligação à internet.";

/// A failed request to CLIP, as a message for the user.
pub fn net_error(e: reqwest::Error) -> String {
    log::warn!("CLIP request failed: {e}");
    if e.is_timeout() {
        CLIP_TIMEOUT
    } else {
        CLIP_UNREACHABLE
    }
    .to_string()
}
pub const INVALID_CREDENTIALS: &str = "Identificador ou senha incorretos";
pub const LOGIN_FAILED: &str = "O CLIP não aceitou o início de sessão. Tente novamente.";
pub const CACHE_ERROR: &str = "Erro ao aceder à cache local";
pub const STUDENT_INFO_UNREADABLE: &str = "Não foi possível ler os dados do aluno";
pub const SCHEDULE_UNREADABLE: &str = "Não foi possível ler o horário";
pub const INVALID_FILE_LINK: &str = "Ligação de ficheiro inválida";
pub const UNKNOWN_STUDENT: &str = "Este aluno não pertence à sessão iniciada";
pub const DOWNLOADS_UNAVAILABLE: &str = "Não foi possível abrir a pasta de transferências";
pub const SAVE_FAILED: &str = "Não foi possível guardar o ficheiro";
pub const NO_STUDENT_DATA: &str = "Esta conta não tem dados de aluno no CLIP";

/// CLIP answered `url` with an error status.
pub fn http_error(url: &str, status: reqwest::StatusCode) -> String {
    log::warn!("CLIP answered {url} with {status}");
    format!("O CLIP respondeu com um erro ({})", status.as_u16())
}
