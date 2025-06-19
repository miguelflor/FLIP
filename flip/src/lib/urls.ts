
export const CLIP_URL = 'https://clip.fct.unl.pt';

export const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  Referer: CLIP_URL+'/',
  'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.7'
};

export const CLIP_HOME = `${CLIP_URL}/utente/eu`;
export const CLIP_STUDENT = `${CLIP_HOME}/aluno`

/**
 * Generates the URL for the academic year page in CLIP.
 * @param year the academic year
 * @returns the URL to given academic year page
 */
export const CLIP_YEAR = (year: string) => `${CLIP_STUDENT}/ano_lectivo?ano_lectivo=${year}`;
