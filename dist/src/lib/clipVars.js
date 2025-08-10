"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeToRealName = exports.FileType = exports.FileTypeAll = exports.PeriodType = exports.UNIDADE = exports.YEAR = exports.TYPE_FILE = exports.PERIOD_TYPE = exports.PERIOD_N = void 0;
exports.stringToFileType = stringToFileType;
exports.PERIOD_N = "per%EDodo_lectivo";
exports.PERIOD_TYPE = "tipo_de_per%EDodo_lectivo";
exports.TYPE_FILE = "tipo_de_documento_de_unidade";
exports.YEAR = "ano_lectivo";
exports.UNIDADE = "unidade";
var PeriodType;
(function (PeriodType) {
    PeriodType["S"] = "s";
    PeriodType["T"] = "t";
})(PeriodType || (exports.PeriodType = PeriodType = {}));
exports.FileTypeAll = "all";
var FileType;
(function (FileType) {
    FileType["MULTIMEDIA"] = "0ac";
    FileType["PROBLEMS"] = "1e";
    FileType["PROTOCOLS"] = "2tr";
    FileType["SEMINARS"] = "3sm";
    FileType["EXAMS"] = "ex";
    FileType["TESTS"] = "t";
    FileType["SUPPORT_TEXTS"] = "ta";
    FileType["OTHERS"] = "xot";
})(FileType || (exports.FileType = FileType = {}));
const typeToRealName = (type) => {
    var _a;
    const map = {
        [FileType.MULTIMEDIA]: "Multimédia",
        [FileType.PROBLEMS]: "Problemas",
        [FileType.PROTOCOLS]: "Protocolos",
        [FileType.SEMINARS]: "Seminários",
        [FileType.EXAMS]: "Exames",
        [FileType.TESTS]: "Testes",
        [FileType.SUPPORT_TEXTS]: "Textos de Apoio",
        [FileType.OTHERS]: "Outros"
    };
    return (_a = map[type]) !== null && _a !== void 0 ? _a : "Desconhecido";
};
exports.typeToRealName = typeToRealName;
function stringToFileType(typeString) {
    // Check direct match first
    if (Object.values(FileType).includes(typeString)) {
        return typeString;
    }
    // Try to match by name using the typeToRealName mapping
    const normalizedString = typeString.toLowerCase();
    for (const type of Object.values(FileType)) {
        // Check if the real name matches (case-insensitive)
        if ((0, exports.typeToRealName)(type).toLowerCase() === normalizedString) {
            return type;
        }
    }
    // No match found
    return undefined;
}
