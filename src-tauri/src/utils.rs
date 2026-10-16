use chrono::{Datelike, Local, NaiveDate};

use crate::constants::FILE_TYPES;
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
