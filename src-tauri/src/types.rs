use std::{collections::HashMap, u8};

use serde::{Deserialize, Serialize};

use crate::constants::{SEMESTER_URL_TYPE, TRIMESTER_URL_TYPE};

// ============================================================================
// Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginResponse {
    pub session_id: String,
    pub aluno_ids: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StudentInfo {
    pub photo_data: Option<String>,
    pub student_name: String,
    pub course: String,
}

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
#[derive(Serialize, Deserialize)]
pub enum Weekday {
    #[serde(rename = "Monday")]
    Monday,
    #[serde(rename = "Tuesday")]
    Tuesday,
    #[serde(rename = "Wednesday")]
    Wednesday,
    #[serde(rename = "Thursday")]
    Thursday,
    #[serde(rename = "Friday")]
    Friday,
}

#[derive(Serialize, Deserialize)]
pub enum ClassType {
    #[serde(rename = "theoretical")]
    Theoretical,
    #[serde(rename = "practical")]
    Practical,
    #[serde(rename = "laboratory")]
    Laboratory,
}

#[derive(Serialize, Deserialize)]
pub struct ScheduleItem {
    pub day: Weekday,
    pub time: String,
    pub class: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub room: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub class_type: Option<ClassType>,
}

const HALF_HOUR: u8 = 30;
const HOUR_MIN: u8 = 60;

pub struct HourMinute {
    pub hour: u8,
    pub min: u8,
}

impl Default for HourMinute {
    fn default() -> Self {
        Self { hour: 8, min: 0 }
    }
}
impl HourMinute {
    fn add_half_hour(&mut self) {
        if self.min + HALF_HOUR >= 60 {
            self.min = (self.min + HALF_HOUR) - HOUR_MIN;
            if self.hour == 23 {
                self.hour = 0;
            } else {
                self.hour += 1
            }
        } else {
            self.min += HALF_HOUR;
        }
    }
}

pub type Schedule = Vec<ScheduleItem>;

#[derive(Debug)]
pub enum Semester {
    First,
    MidYear,
    Second,
}
impl Semester {
    pub fn url_type(&self) -> &str {
        match self {
            Semester::First | Semester::Second => SEMESTER_URL_TYPE,
            Semester::MidYear => TRIMESTER_URL_TYPE,
        }
    }

    pub fn url_num(&self) -> &str {
        match self {
            Semester::First | Semester::MidYear => "1",
            Semester::Second => "2",
        }
    }
}
