// This file maintains the sessions state across API routes
import { AxiosInstance } from 'axios';
import { CookieJar } from 'tough-cookie';

export interface SessionData {
  client: AxiosInstance;
  jar: CookieJar;
  createdAt: number; // Track when the session was created
}

export interface SessionInput{
  client: AxiosInstance;
  jar: CookieJar;
}
// In Next.js, route handlers can be initialized multiple times
// To ensure sessions persist, we attach to global object
declare global {
  var sessionStore: {
    sessions: Map<string, SessionData>;
    lastCleanup: number;
  };
}

// Initialize global session store if it doesn't exist
if (!global.sessionStore) {
  global.sessionStore = {
    sessions: new Map<string, SessionData>(),
    lastCleanup: Date.now(),
  };
}

// Clean up expired sessions (run occasionally)
function cleanupSessions() {
  const now = Date.now();
  // Only run cleanup every 30 minutes
  if (now - global.sessionStore.lastCleanup < 30 * 60 * 1000) return;
  
  const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  for (const [id, session] of global.sessionStore.sessions.entries()) {
    if (now - session.createdAt > MAX_AGE) {
      global.sessionStore.sessions.delete(id);
    }
  }
  
  global.sessionStore.lastCleanup = now;
}

// Helper functions to manage sessions
export function getSession(sessionId: string): SessionData | undefined {
  cleanupSessions();
  return global.sessionStore.sessions.get(sessionId);
}

export function setSession(sessionId: string, data: SessionInput): void {
  cleanupSessions();
  global.sessionStore.sessions.set(sessionId, {
    ...data,
    createdAt: Date.now(),
  });
  
  console.log(`Session created: ${sessionId}`);
  console.log(`Total active sessions: ${global.sessionStore.sessions.size}`);
}

export function deleteSession(sessionId: string): boolean {
  const result = global.sessionStore.sessions.delete(sessionId);
  console.log(`Session deleted: ${sessionId}, success: ${result}`);
  return result;
}

// For debugging purposes
export function getAllSessions(): Map<string, SessionData> {
  return global.sessionStore.sessions;
}

export function logSessionStats(): void {
  console.log(`Total active sessions: ${global.sessionStore.sessions.size}`);
}