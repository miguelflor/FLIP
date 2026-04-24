use serde::{Deserialize, Serialize};

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
    pub time: HourMinute,
    pub class: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub room: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub class_type: Option<ClassType>,
}

const HALF_HOUR: u8 = 30;
const HOUR_MIN: u8 = 60;

#[derive(Serialize, Deserialize)]
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
    pub fn add_half_hour(&mut self) {
        if self.min + HALF_HOUR >= HOUR_MIN {
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
