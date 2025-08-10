"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const headers_1 = require("next/headers");
const sessions_1 = require("@/lib/sessions");
const getChairs_1 = require("@/lib/scrappers/getChairs");
async function GET(req) {
    var _a;
    const sessionId = (_a = (await (0, headers_1.cookies)()).get('clipSession')) === null || _a === void 0 ? void 0 : _a.value;
    if (!sessionId) {
        return server_1.NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const session = (0, sessions_1.getSession)(sessionId);
    if (!session) {
        return server_1.NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }
    try {
        const chairs = await (0, getChairs_1.getChairs)(session.client);
        return server_1.NextResponse.json({ chairs });
    }
    catch (err) {
        return server_1.NextResponse.json({ error: err.message }, { status: 500 });
    }
}
