"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIP_OBJ_DOWNLOAD = exports.CLIP_OBJ = exports.CLIP_DOCS_CLASS = exports.CLIP_YEAR = exports.CLIP_DOCUMENTS = exports.CLIP_YEARS = exports.CLIP_STUDENT = exports.CLIP_HOME = exports.HEADERS = exports.CLIP_URL = void 0;
const clipVars_1 = require("../clipVars");
exports.CLIP_URL = 'https://clip.fct.unl.pt';
exports.HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    Referer: exports.CLIP_URL + '/',
    'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.7'
};
exports.CLIP_HOME = `${exports.CLIP_URL}/utente/eu`;
exports.CLIP_STUDENT = `${exports.CLIP_HOME}/aluno`;
exports.CLIP_YEARS = `${exports.CLIP_STUDENT}/ano_lectivo`;
exports.CLIP_DOCUMENTS = `${exports.CLIP_YEARS}/unidades/unidade_curricular/actividade/documentos`;
/**
 * Generates the URL for the academic year page in CLIP.
 * @param year the academic year
 * @returns the URL to given academic year page
 */
const CLIP_YEAR = (year) => `${exports.CLIP_YEARS}?ano_lectivo=${year}`;
exports.CLIP_YEAR = CLIP_YEAR;
const CLIP_DOCS_CLASS = (year, period, type_period, unitId, docType) => `${exports.CLIP_DOCUMENTS}?${clipVars_1.PERIOD_N}=${period}&${clipVars_1.PERIOD_TYPE}=${type_period}&${clipVars_1.YEAR}=${year}&${clipVars_1.UNIDADE}=${unitId}&${clipVars_1.TYPE_FILE}=${docType}`;
exports.CLIP_DOCS_CLASS = CLIP_DOCS_CLASS;
exports.CLIP_OBJ = `${exports.CLIP_URL}/objecto`;
const CLIP_OBJ_DOWNLOAD = (id, name) => `${exports.CLIP_OBJ}?oid=${id}&oin=${name}`;
exports.CLIP_OBJ_DOWNLOAD = CLIP_OBJ_DOWNLOAD;
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
