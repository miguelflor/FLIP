// src/lib/clipLogin.ts
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import { CLIP_HOME, HEADERS } from './urls';



export async function loginToClip(username: string, password: string) {
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar, withCredentials: true }));

  // Step 1 – Get login page
  const loginPageRes = await client.get(CLIP_HOME, { headers: HEADERS });

  if (loginPageRes.status !== 200) {
    throw new Error(`Login page request failed: ${loginPageRes.status}`);
  }

  // Step 2 – Parse hidden fields (CSRF etc)
  const $ = cheerio.load(loginPageRes.data);
  const form = $('form');

  if (!form) {
    throw new Error('No form found on login page');
  }

  const formData: Record<string, string> = {};
  form.find('input').each((_, el) => {
    const name = $(el).attr('name');
    const value = $(el).val() as string;
    if (name) formData[name] = value || '';
  });

  formData['identificador'] = username;
  formData['senha'] = password;

  const response = await client.post(CLIP_HOME, new URLSearchParams(formData), {
    headers: {
      ...HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    maxRedirects: 0, // prevent auto-follow to catch failed logins
    validateStatus: (status) => status < 400,
  });

  // Step 5 – Check login success (redirect = success)
  if (response.status === 302) {
    console.log('✅ Login successful');
    return { client, jar };
  } else {
    console.error('❌ Login failed', response.status);
    throw new Error('Login failed');
  }
}
