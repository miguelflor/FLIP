use serde::{Deserialize, Serialize};
use strum_macros::EnumIter;

#[derive(Serialize, Deserialize, EnumIter)]
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
    #[serde(rename = "Saturday")]
    Saturday,
    #[serde(rename = "Sunday")]
    Sunday,
}

#[derive(Serialize, Deserialize)]
pub enum ClassType {
    #[serde(rename = "t")]
    Theoretical,
    #[serde(rename = "p")]
    Practical,
    #[serde(rename = "tp")]
    TheoPratical,
}

impl TryFrom<&str> for ClassType {
    type Error = ();

    fn try_from(s: &str) -> Result<Self, Self::Error> {
        match s {
            "t" => Ok(ClassType::Theoretical),
            "p" => Ok(ClassType::Practical),
            "tp" => Ok(ClassType::TheoPratical),
            _ => Err(()),
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct ScheduleItem {
    pub weekday: Weekday,
    pub time_start: HourMinute,
    pub time_end: HourMinute,
    pub class: String,
    pub class_number: u8,
    pub location: String,
    pub class_type: ClassType,
}

const HALF_HOUR: u8 = 30;
const HOUR_MIN: u8 = 60;

#[derive(Clone, Copy, Serialize, Deserialize)]
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
    pub fn add_half_hours(&mut self, n_half_hours: usize) {
        for _ in 0..n_half_hours {
            self.add_half_hour();
        }
    }

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

#[derive(Default, Serialize)]
pub struct Schedule(Vec<ScheduleItem>);

impl Schedule {
    pub fn add_schedule_item(&mut self, item: ScheduleItem) {
        self.0.push(item);
    }
}

mod tests {
    use super::*;

    #[test]
    fn test_add_to_default_half_hour_24_times_is_20_hour() {
        let mut hm = HourMinute::default();
        for _ in 0..24 {
            hm.add_half_hour();
        }
        assert_eq!(hm.hour, 20);
        assert_eq!(hm.min, 0);
    }
}
