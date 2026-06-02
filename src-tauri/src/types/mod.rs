pub mod academic;
pub mod auth;
pub mod schedule;

pub use academic::{Chair, ChairsByPeriod, ChairsResponse, FileParams, FileResponse, Semester};
pub use auth::{LoginResponse, StudentInfo};
pub use schedule::{CalendarEvent, ClassType, HourMinute, Schedule, ScheduleItem, Weekday};
