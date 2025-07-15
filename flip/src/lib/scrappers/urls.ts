import { PERIOD_N, PERIOD_TYPE, TYPE_FILE } from '../clipVars';
export const CLIP_URL = 'https://clip.fct.unl.pt';

export const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  Referer: CLIP_URL+'/',
  'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.7'
};

export const CLIP_HOME = `${CLIP_URL}/utente/eu`;
export const CLIP_STUDENT = `${CLIP_HOME}/aluno`
export const CLIP_YEARS = `${CLIP_STUDENT}/ano_lectivo`;
export const CLIP_DOCUMENTS = `${CLIP_STUDENT}/unidades/unidade_curricular/actividade/documentos`;

/**
 * Generates the URL for the academic year page in CLIP.
 * @param year the academic year
 * @returns the URL to given academic year page
 */
export const CLIP_YEAR = (year: string) => `${CLIP_YEARS}?ano_lectivo=${year}`;

export const CLIP_DOCS_CLASS = (year: string, period: string, unitId: string, docType: string) =>
  `${CLIP_DOCUMENTS}?${PERIOD_N}=${period}&${PERIOD_TYPE}=s&ano_lectivo=${year}&${PERIOD_N}=${period}&unidade=${unitId}&${TYPE_FILE}=${docType}`;

export const CLIP_OBJ = `${CLIP_URL}/objecto`;
export const CLIP_OBJ_DOWNLOAD = (id: string, name : string) => `${CLIP_OBJ}?oid=${id}&oin=${name}`;
/**
 * https://clip.fct.unl.pt/utente/eu/aluno/ano_lectivo/unidades/unidade_curricular/actividade/documentos?
 * tipo_de_per%EDodo_lectivo=s
 * &tipo_de_documento_de_unidade=1e
 * &ano_lectivo=2025&
 * per%EDodo_lectivo=2
 * &aluno=117802
 * &institui%E7%E3o=97747
 * &unidade_curricular=12082
 */



