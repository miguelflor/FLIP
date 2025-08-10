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
exports.loginToClip = loginToClip;
// src/lib/clipLogin.ts
const axios_1 = __importDefault(require("axios"));
const axios_cookiejar_support_1 = require("axios-cookiejar-support");
const tough_cookie_1 = require("tough-cookie");
const cheerio = __importStar(require("cheerio"));
const urls_1 = require("./urls");
async function loginToClip(username, password) {
    const jar = new tough_cookie_1.CookieJar();
    const client = (0, axios_cookiejar_support_1.wrapper)(axios_1.default.create({ jar, withCredentials: true }));
    // Step 1 – Get login page
    const loginPageRes = await client.get(urls_1.CLIP_HOME, { headers: urls_1.HEADERS });
    if (loginPageRes.status !== 200) {
        throw new Error(`Login page request failed: ${loginPageRes.status}`);
    }
    // Step 2 – Parse hidden fields (CSRF etc)
    const $ = cheerio.load(loginPageRes.data);
    const form = $('form');
    if (!form) {
        throw new Error('No form found on login page');
    }
    const formData = {};
    form.find('input').each((_, el) => {
        const name = $(el).attr('name');
        const value = $(el).val();
        if (name)
            formData[name] = value || '';
    });
    formData['identificador'] = username;
    formData['senha'] = password;
    const response = await client.post(urls_1.CLIP_HOME, new URLSearchParams(formData), {
        headers: Object.assign(Object.assign({}, urls_1.HEADERS), { 'Content-Type': 'application/x-www-form-urlencoded' }),
        maxRedirects: 0, // prevent auto-follow to catch failed logins
        validateStatus: (status) => status < 400,
    });
    // Step 5 – Check login success (redirect = success)
    if (response.status === 302) {
        console.log('✅ Login successful');
        return { client, jar };
    }
    else {
        console.error('❌ Login failed', response.status);
        throw new Error('Login failed');
    }
}
