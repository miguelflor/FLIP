import { AxiosInstance } from 'axios';
import { CLIP_DOCS_CLASS, CLIP_DOCUMENTS, CLIP_URL, HEADERS } from './urls';
import { FileType, typeToRealName } from '../clipVars';
import * as cheerio from 'cheerio';
import { getCurrentAcademicYear } from '../academic';
import JSZip  from 'jszip';

export async function getFiles(client: AxiosInstance,period:string,type_period:string,year:string,unitId:string,name:string, types: FileType[] = [FileType.MULTIMEDIA]) {
    const zip = new JSZip();
    const classFolder = zip.folder(`${getCurrentAcademicYear()}-${name}`);
    
    const typesByFiles = types.map(type => async () => {

        if (!Object.values(FileType).includes(type as FileType)) {
            throw new Error(`Invalid file type: ${type}`);
        }

        const filesPage = await client.get(CLIP_DOCS_CLASS(year,period,type_period,unitId,type), {
            headers: HEADERS,
        });


        if (filesPage.status !== 200) {
            throw new Error(`Failed to fetch files page: ${filesPage.status}`);
        }

        const $ = cheerio.load(filesPage.data);
        const files = $('a[href*="/objecto?"]');
        const filteredUrls = files
            .map((_, el) => {
                const href = $(el).attr('href')?.trim();
                return CLIP_URL+href
            })
            .toArray();

        const folder = classFolder?.folder(typeToRealName(type));
        const filteredFiles = filteredUrls.map(async (href) => {
                const file = await client.get(href, {
                    headers: HEADERS,
                    responseType: 'arraybuffer'
                });

                if (file.status !== 200) {
                    throw new Error(`Failed to fetch file: ${file.status}`);
                }

                const temp = href.split('=');
                const fileName = temp[temp.length - 1];

                folder?.file(fileName, file.data);
        });
        
        
        await Promise.all(filteredFiles);
    });
    
    await Promise.all(typesByFiles.map(fn => fn())); // Execute the functions

    return await zip.generateAsync({ type: 'nodebuffer' });
}
