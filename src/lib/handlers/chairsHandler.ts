// src/lib/handlers/chairsHandler.ts

import { getSession } from '../sessions';
import { getChairs } from '../scrappers/getChairs';

export async function chairsHandler(sessionId: string) {
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = getSession(sessionId);
  if (!session) {
    return { success: false, error: 'Session expired' };
  }

  try {
    const chairs = await getChairs(session.client);
    return { success: true, chairs };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
