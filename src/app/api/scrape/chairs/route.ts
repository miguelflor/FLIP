import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/sessions';
import { getChairs } from '@/lib/scrappers/getChairs';

export async function GET(req: NextRequest) {
  const sessionId = (await cookies()).get('clipSession')?.value;
    
  if (!sessionId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }
  
  try {
    const chairs = await getChairs(session.client);

    return NextResponse.json({ chairs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}