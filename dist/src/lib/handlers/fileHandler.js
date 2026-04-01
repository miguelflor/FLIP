"use strict";
// src/lib/handlers/fileHandler.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileHandler = fileHandler;
const sessions_1 = require("../sessions");
const getFiles_1 = require("../scrappers/getFiles");
const clipVars_1 = require("../clipVars");
async function fileHandler(params) {
    const { sessionId, period, unitId, type, name, year, type_period } = params;
    if (!sessionId) {
        return { success: false, error: 'Not authenticated' };
    }
    const session = (0, sessions_1.getSession)(sessionId);
    if (!session) {
        return { success: false, error: 'Session expired' };
    }
    // Validate required parameters
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
        return { success: false, error: `Missing required parameters: ${missingParams.join(', ')}` };
    }
    if (type === undefined) {
        return { success: false, error: 'Type is undefined.' };
    }
    let typeEnums = [];
    if (type !== clipVars_1.FileTypeAll) {
        const fileType = (0, clipVars_1.stringToFileType)(type);
        if (fileType === undefined) {
            return { success: false, error: 'Type does not correspond to a correct one.' };
        }
        typeEnums = [fileType];
    }
    else {
        typeEnums = Object.values(clipVars_1.FileType);
    }
    try {
        const fileBuffer = await (0, getFiles_1.getFiles)(session.client, period, type_period, year, unitId, name, typeEnums);
        // Return the buffer as base64 since IPC can't transfer raw buffers directly
        return {
            success: true,
            data: fileBuffer.toString('base64'),
            filename: `${name}-${period}.zip`
        };
    }
    catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}
