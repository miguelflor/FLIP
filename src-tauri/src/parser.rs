use std::collections::HashMap;

use scraper::{Html, Selector};

use crate::constants::{PERIOD_N, PERIOD_TYPE};
use crate::types::{StudentInfo, Chair, ChairsByPeriod};

// ============================================================================
// HTML Parsing Functions
// ============================================================================

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


pub fn extract_student_info(html: &str) -> Option<StudentInfo> {
    let document = Html::parse_document(html);

    // Extract photo URL
    let photo_selector = Selector::parse("img[alt='Fotografia']").unwrap();
    let photo_url = document
        .select(&photo_selector)
        .next()?
        .value()
        .attr("src")?
        .to_string();

    // Extract student name
    let h3_selector = Selector::parse("h3").unwrap();
    let student_name = document
        .select(&h3_selector)
        .next()?
        .text()
        .collect::<String>()
        .trim()
        .to_string();

    // Extract course
    let course_selector = Selector::parse("td[align='center']").unwrap();
    let course = document
        .select(&course_selector)
        .find_map(|element| {
            let text = element.text().collect::<String>().trim().to_string();
            if text.contains("Mestrado") || text.contains("Licenciatura") || text.contains("Bacharelato") {
                Some(text)
            } else {
                None
            }
        })?;

    Some(StudentInfo {
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