// src/lib/handlers/loginHandler.ts

// This function can be imported and used in Electron's main process
import { loginToClip } from '../scrappers/clipLogin';
import { v4 as uuidv4 } from 'uuid';
import { setSession } from '../sessions';

export async function loginHandler(username: string, password: string) {
  try {
    const { client, jar } = await loginToClip(username, password);
    const sessionId = uuidv4();
    setSession(sessionId, { jar, client });
    // You’re now logged in – can fetch protected pages
    const protectedUrl = 'https://clip.fct.unl.pt/utente/eu';
    const protectedPage = await client.get(protectedUrl);
    return {
      success: true,
      sessionId,
      html: protectedPage.data,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };

  }
}
