use chrono::{Datelike, Local, NaiveDate};

use crate::types::Semester;

// Utility Functions

/// Returns the current semester based on today's date.
///
/// FCT calendar reference (25/26):
///   1st Semester: 02 Sep – 17 Jan
///   Mid-year break: 18 Jan – 22 Feb
///   2nd Semester: 23 Feb – 07 Jul
pub fn get_semester() -> Semester {
    let today = Local::now().date_naive();
    let md = (today.month(), today.day());

    if md >= (9, 2) || md <= (1, 17) {
        Semester::First
    } else if md <= (2, 22) {
        Semester::MidYear
    } else {
        // 23 Feb – 1 Sep: 2nd semester (Jul–Aug still belongs to the ending lective year)
        Semester::Second
    }
}

/// Returns the lective year label as used by CLIP (e.g. "2026" for the 2025/26 academic year).
/// The year increments on 2 Sep: Sep 2025 → Aug 2026 maps to "2026".
pub fn get_lective_year() -> String {
    let today = Local::now().date_naive();
    let year = today.year();
    let sep_2 = NaiveDate::from_ymd_opt(year, 9, 2).unwrap();

    if today >= sep_2 {
        (year + 1).to_string()
    } else {
        year.to_string()
    }
}

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
