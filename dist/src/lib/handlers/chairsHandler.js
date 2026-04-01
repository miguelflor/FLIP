"use strict";
// src/lib/handlers/chairsHandler.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.chairsHandler = chairsHandler;
const sessions_1 = require("../sessions");
const getChairs_1 = require("../scrappers/getChairs");
async function chairsHandler(sessionId) {
    if (!sessionId) {
        return { success: false, error: 'Not authenticated' };
    }
    const session = (0, sessions_1.getSession)(sessionId);
    if (!session) {
        return { success: false, error: 'Session expired' };
    }
    try {
        const chairs = await (0, getChairs_1.getChairs)(session.client);
        return { success: true, chairs };
    }
    catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
        };
    }
}
