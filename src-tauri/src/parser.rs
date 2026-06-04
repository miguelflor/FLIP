use std::collections::HashMap;

use scraper::{Html, Selector};
use strum::IntoEnumIterator;

use crate::constants::{N_ROWS_SCHEDULE_TABLE, PERIOD_N, PERIOD_TYPE};
use crate::types::{Chair, ChairsByPeriod, ClassType, ScheduleItem, Weekday};
use crate::types::{HourMinute, Schedule};

// Helper struct for parsing student info
pub struct ParsedStudentInfo {
    pub photo_url: String,
    pub student_name: String,
    pub course: String,
}

// Parsing Functions

pub fn extract_aluno_ids(html: &str) -> HashMap<String, String> {
    let document = Html::parse_document(html);
    let link_selector = Selector::parse("a[href*='aluno']").unwrap();
    document
        .select(&link_selector)
        .filter_map(|element| {
            let href = element.value().attr("href")?;
            let query_part = href.split('?').nth(1).unwrap_or(href);

            let aluno_id = query_part
                .split('&')
                .find_map(|param| param.strip_prefix("aluno="))?
                .split('&')
                .next()?
                .to_string();

            let display_name = element.text().collect::<String>().trim().to_string();

            if !display_name.is_empty() {
                Some((display_name, aluno_id))
            } else {
                None
            }
        })
        .collect()
}

pub fn extract_student_info(html: &str) -> Option<ParsedStudentInfo> {
    let document = Html::parse_document(html);

    // Extract photo URL and convert relative URL to absolute
    let photo_selector = Selector::parse("img[alt='Fotografia']").unwrap();
    let photo_url = {
        let src = document
            .select(&photo_selector)
            .next()?
            .value()
            .attr("src")?;

        // Convert relative URL to absolute
        if src.starts_with('/') {
            format!("https://clip.fct.unl.pt{}", src)
        } else {
            src.to_string()
        }
    };

    // Extract student name from h3 tag (full text)
    let h3_selector = Selector::parse("h3").unwrap();
    let student_name = document.select(&h3_selector).find_map(|element| {
        let text = element.text().collect::<String>();
        if text.contains("Nº") && text.contains("(") {
            // Remove "Nº XXXXX - " prefix
            let name = if let Some(dash_pos) = text.find(" - ") {
                text[dash_pos + 3..].trim().to_string()
            } else {
                text.trim().to_string()
            };
            Some(name)
        } else {
            None
        }
    })?;

    // Extract course (full text) - look for td with align='center' containing course keywords
    let td_selector = Selector::parse("td[align='center']").unwrap();
    let course = document.select(&td_selector).find_map(|element| {
        let text = element.text().collect::<String>().trim().to_string();

        // Skip empty or non-course cells
        if text.is_empty() {
            return None;
        }

        // Look for course keywords and skip menu items
        if (text.contains("Mestrado")
            || text.contains("Licenciatura")
            || text.contains("Bacharelato"))
            && !text.contains("Acto")
            && !text.contains("Requerimento")
        {
            Some(text)
        } else {
            None
        }
    })?;

    Some(ParsedStudentInfo {
        photo_url,
        student_name,
        course,
    })
}

pub fn parse_chairs(html: &str) -> ChairsByPeriod {
    let document = Html::parse_document(html);

    fn get_chair_links(document: &Html, period_n: &str, period_type: &str) -> Vec<Chair> {
        let link_selector = Selector::parse("a[href]").unwrap();
        let mut chairs = Vec::new();

        for element in document.select(&link_selector) {
            if let Some(href) = element.value().attr("href") {
                if href.contains("&unidade=")
                    && href.contains(&format!("&{}={}", PERIOD_N, period_n))
                    && href.contains(&format!("&{}={}", PERIOD_TYPE, period_type))
                {
                    let text = element.text().collect::<String>().trim().to_string();
                    if !text.is_empty() {
                        chairs.push(Chair {
                            href: href.to_string(),
                            text,
                        });
                    }
                }
            }
        }
        chairs
    }

    ChairsByPeriod {
        s1: get_chair_links(&document, "1", "s"),
        s2: get_chair_links(&document, "2", "s"),
        t1: get_chair_links(&document, "1", "t"),
        t2: get_chair_links(&document, "2", "t"),
    }
}

pub fn parse_file_urls(html: &str) -> Vec<String> {
    let document = Html::parse_document(html);
    let link_selector = Selector::parse("a[href*='/objecto?']").unwrap();

    let d = document
        .select(&link_selector)
        .filter_map(|element| element.value().attr("href").map(String::from))
        .collect();

    return d;
}

pub fn extract_years(html: &str) -> Vec<String> {
    let document = Html::parse_document(html);

    // Look for links with ano_lectivo parameter
    let link_selector = Selector::parse("a[href*='ano_lectivo']").unwrap();

    let mut years: Vec<String> = document
        .select(&link_selector)
        .filter_map(|element| {
            let text = element.text().collect::<String>().trim().to_string();
            // Match pattern like "2024/25" or "2025/26"
            if text.contains('/') && text.len() == 7 {
                Some(text)
            } else {
                None
            }
        })
        .collect();

    // Remove duplicates and sort in descending order
    years.sort_by(|a, b| b.cmp(a));
    years.dedup();

    years
}

pub fn parse_schedule(html: &str) -> Result<Schedule, String> {
    let doc = Html::parse_document(html);
    let table_selector = Selector::parse("table").unwrap();

    let html_schedule = doc
        .select(&table_selector)
        .find(|t| t.select(&Selector::parse("tr").unwrap()).count() == N_ROWS_SCHEDULE_TABLE)
        .ok_or("Schedule table not found in HTML")?;

    let tr_select = Selector::parse("tr").unwrap();

    let mut hm = HourMinute::default();
    let rows: Vec<_> = html_schedule.select(&tr_select).collect();

    let mut schedule = Schedule::default();

    // Each tr is half an hour in clip schedule
    for row in &rows[1..] {
        hm.add_half_hour();
        let td_select = Selector::parse("td").unwrap();
        let columns: Vec<_> = row.select(&td_select).collect();

        // Each td is a weekday
        for (weekday, column) in Weekday::iter().zip(&columns[1..]) {
            if let Some(rowspan_str) = column.attr("rowspan") {
                if let Ok(span_value) = rowspan_str.parse::<usize>() {
                    // Each row is 30 minutes, so the time of the class is span*30
                    let mut time_end = hm;
                    time_end.add_half_hours(span_value);
                    // Each <b><b/> has the name of the class
                    let b_select = Selector::parse("b").unwrap();
                    let bs: Vec<_> = column.select(&b_select).collect();
                    let Some(b) = bs.first() else {
                        return Err("No class name found for rowspanned td".to_string());
                    };
                    let class: String = b.text().collect();

                    // Each anchor <a></a> has the type and class number (e.g. "t.1", "p", "tp")
                    let anchor_select = Selector::parse("a").unwrap();
                    let anchors: Vec<_> = column.select(&anchor_select).collect();
                    let Some(anchor) = anchors.first() else {
                        return Err("No anchor found for rowspanned td".to_string());
                    };
                    // e.g "t.1"
                    let type_number_str: String = anchor.text().collect();
                    let mut parts = type_number_str.splitn(2, '.');
                    // e.g "t"
                    let Some(class_type) = parts.next().and_then(|s| ClassType::try_from(s).ok())
                    else {
                        return Err(format!("Could not parse class type from: {}", type_number_str));
                    };
                    // e.g "1"
                    let Some(class_number) = parts.next().and_then(|s| s.parse::<u8>().ok()) else {
                        return Err(format!("Could not parse class number from: {}", type_number_str));
                    };
                    // Room is the first non-empty text node in the column
                    let Some(location) = column
                        .children()
                        .filter_map(|n| n.value().as_text().map(|t| t.trim().to_string()))
                        .find(|t| !t.is_empty())
                    else {
                        return Err(format!("No room found for: {}", type_number_str));
                    };

                    schedule.add_schedule_item(ScheduleItem {
                        weekday,
                        time_start: hm,
                        time_end,
                        class,
                        class_number,
                        location,
                        class_type,
                    });
                }
            }
        }
    }
    Ok(schedule)
}
