// src/lib/handlers/fileHandler.ts

import { getSession } from '../sessions';
import { getFiles } from '../scrappers/getFiles';
import { FileType, FileTypeAll, stringToFileType } from '../clipVars';

export interface FileHandlerParams {
  sessionId: string;
  period: string;
  unitId: string;
  type: string;
  name: string;
  year: string;
  type_period: string;
}

export async function fileHandler(params: FileHandlerParams) {
  const { sessionId, period, unitId, type, name, year, type_period } = params;

  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = getSession(sessionId);
  if (!session) {
    return { success: false, error: 'Session expired' };
  }

  // Validate required parameters
  const missingParams = [];
  if (!period) missingParams.push('period');
  if (!unitId) missingParams.push('unitId');
  if (!type_period) missingParams.push('type_period');
  if (!name) missingParams.push('name');
  if (!year) missingParams.push('year');

  if (missingParams.length > 0) {
    return { success: false, error: `Missing required parameters: ${missingParams.join(', ')}` };
  }

  if (type === undefined) {
    return { success: false, error: 'Type is undefined.' };
  }

  let typeEnums: FileType[] = [];
  if (type !== FileTypeAll) {
    const fileType = stringToFileType(type);

    if (fileType === undefined) {
      return { success: false, error: 'Type does not correspond to a correct one.' };
    }

    typeEnums = [fileType];
  } else {
    typeEnums = Object.values(FileType);
  }

  try {
    const fileBuffer = await getFiles(session.client, period, type_period, year, unitId, name, typeEnums);
    
    // Return the buffer as base64 since IPC can't transfer raw buffers directly
    return {
      success: true,
      data: fileBuffer.toString('base64'),
      filename: `${name}-${period}.zip`
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
