import { AxiosInstance } from "axios";
import { CLIP_YEAR, HEADERS } from "../urls";
import { getCurrentAcademicYear } from "../academic";
import * as cheerio from 'cheerio';

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

    const chairLinks = $('a[href*="&unidade="]')
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
    console.log('Found chair links:', chairLinks);
    return chairLinks;
}
