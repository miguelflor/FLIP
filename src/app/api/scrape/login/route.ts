// src/app/api/scrape/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { loginToClip } from '@/lib/scrappers/clipLogin';
import { cookies }  from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { setSession } from '@/lib/sessions';


export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  try {
    const { client, jar } = await loginToClip(username, password);

    const sessionId = uuidv4();
    
    setSession(sessionId, { jar, client});

    (await cookies()).set('clipSession', sessionId, {
      httpOnly:true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60*60*24,
      path: '/'
    });
    // You’re now logged in – can fetch protected pages
    const protectedUrl = 'https://clip.fct.unl.pt/utente/eu';
    const protectedPage = await client.get(protectedUrl);
    return NextResponse.json({
      message: 'Login and fetch OK',
      html: protectedPage.data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
