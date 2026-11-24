use std::fmt::Display;

use crate::constants::{
    CLIP_HOME, CLIP_SCHEDULE, CLIP_TESTS, PERIOD_N, PERIOD_TYPE, STUDENT, TYPE_FILE, UNIDADE, YEAR,
};
use crate::errors::INVALID_PERIOD;

#[derive(Debug, Clone, PartialEq)]
pub enum UrlType {
    StudentInfo,
    Schedule,
    Tests,
    Documents,
    Photo,
}

#[derive(Debug, Clone)]
pub struct Url {
    pub value: String,
    pub url_type: UrlType,
}

impl Url {
    pub fn student(student: &str) -> Self {
        Self {
            value: format!("{}/aluno?aluno={}", CLIP_HOME, student),
            url_type: UrlType::StudentInfo,
        }
    }

    pub fn student_years(student: &str) -> Self {
        Self {
            value: format!(
                "{}/aluno/ano_lectivo?aluno={}&instituição=97747",
                CLIP_HOME, student
            ),
            url_type: UrlType::StudentInfo,
        }
    }

    pub fn year_student(year: &str, student: &str) -> Self {
        Self {
            value: format!(
                "{}/aluno/ano_lectivo?aluno={}&ano_lectivo={}",
                CLIP_HOME, student, year
            ),
            url_type: UrlType::StudentInfo,
        }
    }

    // Ex.: https://clip.fct.unl.pt/utente/eu/aluno/ano_lectivo/hor%E1rio?ano_lectivo=2026&institui%E7%E3o=97747&aluno=132271&tipo_de_per%EDodo_lectivo=s&per%EDodo_lectivo=2
    pub fn schedule(student: &str, year: &str, period: &str) -> Result<Self, String> {
        Ok(Self {
            value: format!("{}?{}", CLIP_SCHEDULE, period_query(student, year, period)?),
            url_type: UrlType::Schedule,
        })
    }

    // Ex.: https://clip.fct.unl.pt/utente/eu/aluno/acto_curricular/inscri%E7%E3o/testes_de_avalia%E7%E3o?aluno=131358&institui%E7%E3o=97747&ano_lectivo=2027&tipo_de_per%EDodo_lectivo=s&per%EDodo_lectivo=1
    pub fn tests(student: &str, year: &str, period: &str) -> Result<Self, String> {
        Ok(Self {
            value: format!("{}?{}", CLIP_TESTS, period_query(student, year, period)?),
            url_type: UrlType::Tests,
        })
    }

    pub fn documents(
        student: &str,
        year: &str,
        period: &str,
        type_period: &str,
        unit_id: &str,
        doc_type: &str,
    ) -> Self {
        Self {
            value: format!(
                "{}/aluno/ano_lectivo/unidades/unidade_curricular/actividade/documentos?{}={}&{}={}&{}={}&{}={}&{}={}&{}={}",
                CLIP_HOME, PERIOD_N, period, PERIOD_TYPE, type_period, YEAR, year, STUDENT, student, UNIDADE, unit_id, TYPE_FILE, doc_type
            ),
            url_type: UrlType::Documents,
        }
    }
}

/// Query for a student's period page. `year` is CLIP's lective year ("2026" for 2025/26)
/// and `period` a ChairsByPeriod key ("s1", "s2", "t1", "t2"). Which period is current is
/// the frontend's call (lib/academic.ts), so the calendar lives in one place.
fn period_query(student: &str, year: &str, period: &str) -> Result<String, String> {
    let valid_year = year.len() == 4 && year.bytes().all(|b| b.is_ascii_digit());
    if !valid_year || !matches!(period, "s1" | "s2" | "t1" | "t2") {
        return Err(INVALID_PERIOD.to_string());
    }
    let (period_type, period_n) = period.split_at(1);
    // TODO: institui%E7%E3o (97747 = FCT) is hardcoded for now; extract it dynamically from CLIP HTML.
    Ok(format!(
        "ano_lectivo={}&institui%E7%E3o=97747&{}={}&{}={}&{}={}",
        year, STUDENT, student, PERIOD_TYPE, period_type, PERIOD_N, period_n
    ))
}

impl Display for Url {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.value)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn builds_period_pages_for_the_given_year_and_period() {
        let url = Url::schedule("123", "2026", "s2").unwrap();
        assert!(url.value.ends_with(
            "?ano_lectivo=2026&institui%E7%E3o=97747&aluno=123&tipo_de_per%EDodo_lectivo=s&per%EDodo_lectivo=2"
        ));
        let url = Url::tests("123", "2027", "t1").unwrap();
        assert!(url
            .value
            .contains("&tipo_de_per%EDodo_lectivo=t&per%EDodo_lectivo=1"));
    }

    #[test]
    fn rejects_unknown_years_and_periods() {
        for (year, period) in [
            ("2026", "s3"),
            ("2026", ""),
            ("26", "s1"),
            ("2026&x=1", "s1"),
        ] {
            assert_eq!(
                Url::schedule("123", year, period).unwrap_err(),
                INVALID_PERIOD,
                "{year} {period}"
            );
        }
    }
}
