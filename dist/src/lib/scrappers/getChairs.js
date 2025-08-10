"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChairs = getChairs;
const urls_1 = require("./urls");
const academic_1 = require("../academic");
const cheerio = __importStar(require("cheerio"));
const clipVars_1 = require("../clipVars");
async function getChairs(client) {
    const chairsPage = await client.get((0, urls_1.CLIP_YEAR)((0, academic_1.getCurrentAcademicYear)()), {
        headers: urls_1.HEADERS,
        responseType: 'arraybuffer'
    });
    if (chairsPage.status !== 200) {
        throw new Error(`Failed to fetch chairs page: ${chairsPage.status}`);
    }
    const html = new TextDecoder('ISO-8859-1').decode(chairsPage.data);
    const $ = cheerio.load(html);
    function getChairLinks(periodN, periodType) {
        return $(`a[href*="&unidade="][href*="&${clipVars_1.PERIOD_N}=${periodN}"][href*="&${clipVars_1.PERIOD_TYPE}=${periodType}"]`)
            .map((_, a) => {
            var _a;
            const href = (_a = $(a).attr('href')) === null || _a === void 0 ? void 0 : _a.trim();
            const text = $(a).text().trim();
            if (href && text) {
                return { href, text };
            }
            return null;
        })
            .get()
            .filter(Boolean);
    }
    const chairLinks = {
        [clipVars_1.PeriodType.S + "1"]: getChairLinks("1", clipVars_1.PeriodType.S),
        [clipVars_1.PeriodType.S + "2"]: getChairLinks("2", clipVars_1.PeriodType.S),
        [clipVars_1.PeriodType.T + "1"]: getChairLinks("1", clipVars_1.PeriodType.T),
        [clipVars_1.PeriodType.T + "2"]: getChairLinks("2", clipVars_1.PeriodType.T),
    };
    return chairLinks;
}
