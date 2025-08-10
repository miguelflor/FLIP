"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSession = getSession;
exports.setSession = setSession;
exports.deleteSession = deleteSession;
exports.getAllSessions = getAllSessions;
exports.logSessionStats = logSessionStats;
// Initialize global session store if it doesn't exist
if (!global.sessionStore) {
    global.sessionStore = {
        sessions: new Map(),
        lastCleanup: Date.now(),
    };
}
// Clean up expired sessions (run occasionally)
function cleanupSessions() {
    const now = Date.now();
    // Only run cleanup every 30 minutes
    if (now - global.sessionStore.lastCleanup < 30 * 60 * 1000)
        return;
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    for (const [id, session] of global.sessionStore.sessions.entries()) {
        if (now - session.createdAt > MAX_AGE) {
            global.sessionStore.sessions.delete(id);
        }
    }
    global.sessionStore.lastCleanup = now;
}
// Helper functions to manage sessions
function getSession(sessionId) {
    cleanupSessions();
    return global.sessionStore.sessions.get(sessionId);
}
function setSession(sessionId, data) {
    cleanupSessions();
    global.sessionStore.sessions.set(sessionId, Object.assign(Object.assign({}, data), { createdAt: Date.now() }));
    console.log(`Session created: ${sessionId}`);
    console.log(`Total active sessions: ${global.sessionStore.sessions.size}`);
}
function deleteSession(sessionId) {
    const result = global.sessionStore.sessions.delete(sessionId);
    console.log(`Session deleted: ${sessionId}, success: ${result}`);
    return result;
}
// For debugging purposes
function getAllSessions() {
    return global.sessionStore.sessions;
}
function logSessionStats() {
    console.log(`Total active sessions: ${global.sessionStore.sessions.size}`);
}
