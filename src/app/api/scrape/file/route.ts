import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/sessions';
import { getFiles } from '@/lib/scrappers/getFiles';
import { FileType, FileTypeAll, PERIOD_N, PERIOD_TYPE,stringToFileType, UNIDADE, YEAR } from '@/lib/clipVars';
import { error } from 'console';
import { stat } from 'fs';
import next from 'next';
import { NextURL } from 'next/dist/server/web/next-url';

export async function GET(req: NextRequest) {
  const sessionId = (await cookies()).get('clipSession')?.value;

  // Work with the raw search string to avoid encoding issues
  const searchString = req.nextUrl.search;
  
  // Parse parameters manually to preserve exact encoding
  const parseParams = (search: string) => {
    const params: Record<string, string> = {};
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
  
  const period = params[PERIOD_N];
  const unitId = params[UNIDADE];
  const type = params['type'];
  const name = params['name'];
  const year = params[YEAR];
  const type_period = params[PERIOD_TYPE];
  
    
  if (!sessionId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const missingParams = [];
  if (!period) missingParams.push('period');
  if (!unitId) missingParams.push('unitId');
  if (!type_period) missingParams.push('type_period');
  if (!name) missingParams.push('name');
  if (!year) missingParams.push('year');
  
  if (missingParams.length > 0) {
    return NextResponse.json({ error: `Missing required parameters: ${missingParams.join(', ')}` }, { status: 400 });
  }
  
  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }
  
  if (type == undefined) {
    return NextResponse.json({ error: 'Type is undefined.' }, { status: 400 });
  }

  let typeEnums: FileType[] = [];
  if (type != FileTypeAll){
    const fileType = stringToFileType(type);

    if (fileType === undefined) {
      return NextResponse.json({ error: 'Type does not correspond to a correct one.'}, {status: 400});
    }

    typeEnums = [fileType];
  }else{
    typeEnums = Object.values(FileType);
  }
  

  try {
    const file = await getFiles(session.client, period!, type_period!, year!, unitId!, name!, typeEnums);

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