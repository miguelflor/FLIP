/// Decodes CLIP's pages, which declare ISO-8859-1. Like browsers, this reads them as
/// Windows-1252, its superset: bytes 0x80–0x9F are characters such as – “ ” €, not controls.
pub fn decode_clip_text(bytes: &[u8]) -> String {
    encoding_rs::WINDOWS_1252
        .decode_without_bom_handling(bytes)
        .0
        .into_owned()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_latin1_and_windows_1252_punctuation() {
        // "Época – “Exame” €" in Windows-1252
        let bytes = b"\xC9poca \x96 \x93Exame\x94 \x80";
        assert_eq!(decode_clip_text(bytes), "Época – “Exame” €");
    }
}
