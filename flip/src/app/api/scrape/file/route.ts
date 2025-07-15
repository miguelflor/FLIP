import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/sessions';
import { getFiles } from '@/lib/scrappers/getFiles';
import { stringToFileType } from '@/lib/clipVars';

export async function GET(req: NextRequest) {
  const sessionId = (await cookies()).get('clipSession')?.value;

  const { searchParams } = req.nextUrl;
  const period = searchParams.get('period');
  const unitId = searchParams.get('unitId');
  const types = searchParams.getAll('types');
  const name = searchParams.get('name');
    
  if (!sessionId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!period || !unitId || types.length === 0 || !name) {
    return NextResponse.json({ error: 'Missing required parameters: period or unitId or types or name.' }, { status: 400 });
  }
  
  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }

  const typesEnum = types.map(type => stringToFileType(type));

  if (typesEnum.includes(undefined)) {
    return NextResponse.json({ error: 'Invalid file type provided.' }, { status: 400 });
  }

  // Filter out undefined to ensure typesEnum is FileType[]
  const validTypesEnum = typesEnum.filter((t): t is NonNullable<typeof t> => t !== undefined);

  try {
    const file = await getFiles(session.client, period, unitId, name, validTypesEnum);

    return new NextResponse(file, { 
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${name}-${period}.zip"`,
        'Content-Length': file.length.toString()
      } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}