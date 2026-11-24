import { beforeEach, describe, expect, it, vi } from 'vitest';

const load = async () => (await import('./usePreload')).usePreload();

describe('usePreload', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('preloads only the selected period by default', async () => {
    const { preload, preloads } = await load();
    expect(preload.value).toBe('period');
    expect(preloads('s1', 's1')).toBe(true);
    expect(preloads('s2', 's1')).toBe(false);
  });

  it('can preload every period, or none', async () => {
    const { setPreload, preloads } = await load();
    setPreload('all');
    expect(preloads('s2', 's1')).toBe(true);
    setPreload('none');
    expect(preloads('s1', 's1')).toBe(false);
  });

  it('remembers the choice across restarts', async () => {
    (await load()).setPreload('all');
    vi.resetModules();
    expect((await load()).preload.value).toBe('all');

    (await load()).setPreload('period');
    expect(localStorage.getItem('preload_files')).toBeNull();
  });
});
