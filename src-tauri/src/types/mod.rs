pub mod academic;
pub mod auth;
pub mod schedule;

pub use academic::{
    Chair, ChairsByPeriod, ChairsResponse, CourseDownload, CourseFile, FileParams, FileRef,
    Semester, Test,
};
pub use auth::{LoginResponse, StudentInfo};
pub use schedule::{ClassType, HourMinute, Schedule, ScheduleItem, Weekday};
