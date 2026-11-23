import { describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { fileName, saveDownload, savedMessage } from './downloads';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

describe('downloads', () => {
  it('names the saved file whatever the OS path style', () => {
    expect(fileName('/home/ana/Downloads/Aula 1.pdf')).toBe('Aula 1.pdf');
    expect(fileName('C:\\Users\\Ana\\Downloads\\Aula 1 (1).pdf')).toBe('Aula 1 (1).pdf');
    expect(savedMessage('/x/y.png')).toBe('«y.png» guardado na pasta de transferências');
  });

  it('sends the bytes to the backend as a plain array', async () => {
    vi.mocked(invoke).mockResolvedValue('/x/horario.png');
    await expect(saveDownload('horario.png', new Uint8Array([1, 2, 255]))).resolves.toBe('/x/horario.png');
    expect(invoke).toHaveBeenCalledWith('save_download', { name: 'horario.png', data: [1, 2, 255] });
  });
});
