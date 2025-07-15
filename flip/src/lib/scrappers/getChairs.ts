import { AxiosInstance } from "axios";
import { CLIP_YEAR, HEADERS } from "./urls";
import { getCurrentAcademicYear } from "../academic";
import * as cheerio from 'cheerio';
import { PERIOD_N, PeriodType, PERIOD_TYPE } from "../clipVars";

export async function getChairs(client: AxiosInstance){
    const chairsPage = await client.get(CLIP_YEAR(getCurrentAcademicYear()), 
    {
        headers: HEADERS,
        responseType: 'arraybuffer'
    });

    if (chairsPage.status !== 200) {
        throw new Error(`Failed to fetch chairs page: ${chairsPage.status}`);
    }
    const html = new TextDecoder('ISO-8859-1').decode(chairsPage.data);
    const $ = cheerio.load(html);

    function getChairLinks(periodN: string, periodType: string) {
        return $(`a[href*="&unidade="][href*="&${PERIOD_N}=${periodN}"][href*="&${PERIOD_TYPE}=${periodType}"]`)
            .map((_, a) => {
                const href = $(a).attr('href')?.trim();
                const text = $(a).text().trim();
                if (href && text) {
                    return { href, text };
                }
                return null;
            })
            .get()
            .filter(Boolean);
    }

    const chairLinks: Record<string, { href: string; text: string; }[]> = {
        [PeriodType.S + "1"]: getChairLinks("1", PeriodType.S),
        [PeriodType.S + "2"]: getChairLinks("2", PeriodType.S),
        [PeriodType.T + "1"]: getChairLinks("1", PeriodType.T),
        [PeriodType.T + "2"]: getChairLinks("2", PeriodType.T),
    };
    console.log('Found chair links:', chairLinks);
    return chairLinks;
}
