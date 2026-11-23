import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { forgetCourseFiles, listCourseFiles } from './useCourseFiles';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

const unit = { session_id: 's', period: '1', unit_id: '42', year: '2026', type_period: 's' };

describe('listCourseFiles', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    forgetCourseFiles();
  });

  it('asks CLIP once per unit and session', async () => {
    vi.mocked(invoke).mockResolvedValue([]);
    await Promise.all([listCourseFiles(unit, '123'), listCourseFiles(unit, '123')]);
    await listCourseFiles(unit, '123');
    expect(invoke).toHaveBeenCalledTimes(1);

    await listCourseFiles({ ...unit, session_id: 'other' }, '123');
    await listCourseFiles({ ...unit, unit_id: '43' }, '123');
    expect(invoke).toHaveBeenCalledTimes(3);
  });

  it('does not remember failures', async () => {
    vi.mocked(invoke).mockRejectedValueOnce('erro').mockResolvedValueOnce([]);
    await expect(listCourseFiles(unit, '123')).rejects.toBe('erro');
    await expect(listCourseFiles(unit, '123')).resolves.toEqual([]);
  });

  it('asks again after being told to forget', async () => {
    vi.mocked(invoke).mockResolvedValue([]);
    await listCourseFiles(unit, '123');
    forgetCourseFiles();
    await listCourseFiles(unit, '123');
    expect(invoke).toHaveBeenCalledTimes(2);
  });
});
