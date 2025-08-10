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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFiles = getFiles;
const urls_1 = require("./urls");
const clipVars_1 = require("../clipVars");
const cheerio = __importStar(require("cheerio"));
const academic_1 = require("../academic");
const jszip_1 = __importDefault(require("jszip"));
async function getFiles(client, period, type_period, year, unitId, name, types = [clipVars_1.FileType.MULTIMEDIA]) {
    const zip = new jszip_1.default();
    const classFolder = zip.folder(`${(0, academic_1.getCurrentAcademicYear)()}-${name}`);
    const typesByFiles = types.map(type => async () => {
        if (!Object.values(clipVars_1.FileType).includes(type)) {
            throw new Error(`Invalid file type: ${type}`);
        }
        const filesPage = await client.get((0, urls_1.CLIP_DOCS_CLASS)(year, period, type_period, unitId, type), {
            headers: urls_1.HEADERS,
        });
        if (filesPage.status !== 200) {
            throw new Error(`Failed to fetch files page: ${filesPage.status}`);
        }
        const $ = cheerio.load(filesPage.data);
        const files = $('a[href*="/objecto?"]');
        const filteredUrls = files
            .map((_, el) => {
            var _a;
            const href = (_a = $(el).attr('href')) === null || _a === void 0 ? void 0 : _a.trim();
            return urls_1.CLIP_URL + href;
        })
            .toArray();
        const folder = classFolder === null || classFolder === void 0 ? void 0 : classFolder.folder((0, clipVars_1.typeToRealName)(type));
        const filteredFiles = filteredUrls.map(async (href) => {
            const file = await client.get(href, {
                headers: urls_1.HEADERS,
                responseType: 'arraybuffer'
            });
            if (file.status !== 200) {
                throw new Error(`Failed to fetch file: ${file.status}`);
            }
            const temp = href.split('=');
            const fileName = temp[temp.length - 1];
            folder === null || folder === void 0 ? void 0 : folder.file(fileName, file.data);
        });
        await Promise.all(filteredFiles);
    });
    await Promise.all(typesByFiles.map(fn => fn())); // Execute the functions
    return await zip.generateAsync({ type: 'nodebuffer' });
}
