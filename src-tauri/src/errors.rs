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
