use std::collections::HashMap;

use scraper::{Html, Selector};

use crate::constants::{PERIOD_N, PERIOD_TYPE};
use crate::types::{Chair, ChairsByPeriod};

// ============================================================================
// HTML Parsing Functions
// ============================================================================

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
