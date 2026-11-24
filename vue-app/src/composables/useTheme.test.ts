import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

/** A stand-in for the OS's dark-mode setting, which can be flipped. */
const fakeOs = (dark: boolean) => {
  const listeners: ((e: { matches: boolean }) => void)[] = [];
  const media = {
    matches: dark,
    addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => listeners.push(cb),
  };
  vi.stubGlobal('matchMedia', () => media);
  return (now: boolean) => {
    media.matches = now;
    listeners.forEach((cb) => cb({ matches: now }));
  };
};

// The theme lives in module state, so each test imports a fresh copy.
const loadTheme = async () => (await import('./useTheme')).useTheme();
const darkClass = () => document.documentElement.classList.contains('dark');

describe('useTheme', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('follows the OS by default, also when it changes', async () => {
    const setOsDark = fakeOs(false);
    const { theme } = await loadTheme();
    expect(theme.value).toBe('system');
    expect(darkClass()).toBe(false);

    setOsDark(true);
    await nextTick();
    expect(darkClass()).toBe(true);
  });

  it('keeps an explicit choice whatever the OS does, across restarts', async () => {
    const setOsDark = fakeOs(false);
    const { setTheme } = await loadTheme();
    setTheme('dark');
    await nextTick();
    setOsDark(false);
    await nextTick();
    expect(darkClass()).toBe(true);

    vi.resetModules();
    fakeOs(false);
    const reloaded = await loadTheme();
    expect(reloaded.theme.value).toBe('dark');
  });

  it('keeps the light/dark choice saved by earlier versions', async () => {
    localStorage.setItem('theme', 'light');
    fakeOs(true);
    const { theme } = await loadTheme();
    expect(theme.value).toBe('light');
    expect(darkClass()).toBe(false);
  });

  it('forgets the choice when set back to follow the OS', async () => {
    fakeOs(true);
    const { setTheme } = await loadTheme();
    setTheme('light');
    setTheme('system');
    expect(localStorage.getItem('theme')).toBeNull();
    await nextTick();
    expect(darkClass()).toBe(true);
  });
});
