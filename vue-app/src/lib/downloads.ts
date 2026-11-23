import { invoke } from '@tauri-apps/api/core';

/** The file name at the end of a path, on any OS. */
export const fileName = (path: string) => path.split(/[\\/]/).pop() || path;

/** The toast shown once a file is in the downloads folder. */
export const savedMessage = (path: string) => `«${fileName(path)}» guardado na pasta de transferências`;

/** Saves a file made in the app into the downloads folder; resolves to where it went. */
export const saveDownload = (name: string, data: Uint8Array) =>
  invoke<string>('save_download', { name, data: Array.from(data) });
