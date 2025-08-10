"use strict";
// src/app/api/scrape/route.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginHandler = loginHandler;
// This function can be imported and used in Electron's main process
const clipLogin_1 = require("../scrappers/clipLogin");
const uuid_1 = require("uuid");
const sessions_1 = require("../sessions");
async function loginHandler(username, password) {
    try {
        const { client, jar } = await (0, clipLogin_1.loginToClip)(username, password);
        const sessionId = (0, uuid_1.v4)();
        (0, sessions_1.setSession)(sessionId, { jar, client });
        // You’re now logged in – can fetch protected pages
        const protectedUrl = 'https://clip.fct.unl.pt/utente/eu';
        const protectedPage = await client.get(protectedUrl);
        return {
            success: true,
            sessionId,
            html: protectedPage.data,
        };
    }
    catch (err) {
        return {
            success: false,
            error: err.message,
        };
    }
}
