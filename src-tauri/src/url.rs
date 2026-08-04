use std::fmt::Display;

use crate::constants::{
    CLIP_HOME, CLIP_SCHEDULE, PERIOD_N, PERIOD_TYPE, STUDENT, TYPE_FILE, UNIDADE, YEAR,
};
use crate::utils::{get_lective_year, get_semester};

#[derive(Debug, Clone, PartialEq)]
pub enum UrlType {
    StudentInfo,
    Schedule,
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
            value: format!("{}/aluno/ano_lectivo?aluno={}&instituição=97747", CLIP_HOME, student),
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
    pub fn schedule(student: &str, year: Option<&str>) -> Self {
        let sem = get_semester();
        let lective_year = year.map(|y| y.to_string()).unwrap_or_else(get_lective_year);
        // TODO: institui%E7%E3o (97747 = FCT) is hardcoded for now; extract it dynamically from CLIP HTML.
        Self {
            value: format!(
                "{}?ano_lectivo={}&institui%E7%E3o=97747&{}={}&{}={}&{}={}",
                CLIP_SCHEDULE,
                lective_year,
                STUDENT,
                student,
                PERIOD_TYPE,
                sem.url_type(),
                PERIOD_N,
                sem.url_num()
            ),
            url_type: UrlType::Schedule,
        }
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

impl Display for Url {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.value)
    }
}
