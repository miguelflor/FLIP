"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const headers_1 = require("next/headers");
const sessions_1 = require("@/lib/sessions");
const getFiles_1 = require("@/lib/scrappers/getFiles");
const clipVars_1 = require("@/lib/clipVars");
async function GET(req) {
    var _a;
    const sessionId = (_a = (await (0, headers_1.cookies)()).get('clipSession')) === null || _a === void 0 ? void 0 : _a.value;
    // Work with the raw search string to avoid encoding issues
    const searchString = req.nextUrl.search;
    // Parse parameters manually to preserve exact encoding
    const parseParams = (search) => {
        const params = {};
        if (search.startsWith('?')) {
            search = search.substring(1);
        }
        const pairs = search.split('&');
        for (const pair of pairs) {
            const [key, value] = pair.split('=');
            if (key && value !== undefined) {
                // Only decode the value, keep the key as-is to match constants
                params[key] = decodeURIComponent(value);
            }
        }
        return params;
    };
    const params = parseParams(searchString);
    const period = params[clipVars_1.PERIOD_N];
    const unitId = params[clipVars_1.UNIDADE];
    const type = params['type'];
    const name = params['name'];
    const year = params[clipVars_1.YEAR];
    const type_period = params[clipVars_1.PERIOD_TYPE];
    if (!sessionId) {
        return server_1.NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const missingParams = [];
    if (!period)
        missingParams.push('period');
    if (!unitId)
        missingParams.push('unitId');
    if (!type_period)
        missingParams.push('type_period');
    if (!name)
        missingParams.push('name');
    if (!year)
        missingParams.push('year');
    if (missingParams.length > 0) {
        return server_1.NextResponse.json({ error: `Missing required parameters: ${missingParams.join(', ')}` }, { status: 400 });
    }
    const session = (0, sessions_1.getSession)(sessionId);
    if (!session) {
        return server_1.NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }
    if (type == undefined) {
        return server_1.NextResponse.json({ error: 'Type is undefined.' }, { status: 400 });
    }
    let typeEnums = [];
    if (type != clipVars_1.FileTypeAll) {
        const fileType = (0, clipVars_1.stringToFileType)(type);
        if (fileType === undefined) {
            return server_1.NextResponse.json({ error: 'Type does not correspond to a correct one.' }, { status: 400 });
        }
        typeEnums = [fileType];
    }
    else {
        typeEnums = Object.values(clipVars_1.FileType);
    }
    try {
        const file = await (0, getFiles_1.getFiles)(session.client, period, type_period, year, unitId, name, typeEnums);
        return new server_1.NextResponse(file, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${name}-${period}.zip"`,
                'Content-Length': file.length.toString()
            }
        });
    }
    catch (err) {
        return server_1.NextResponse.json({ error: err.message }, { status: 500 });
    }
}
