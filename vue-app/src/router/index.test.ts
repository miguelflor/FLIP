import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import router from './index';
import { useStudent } from '../composables/useStudent';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

describe('router', () => {
  beforeEach(async () => {
    vi.mocked(invoke).mockReset().mockResolvedValue(undefined);
    useStudent().endSession();
    await router.push('/');
  });

  it('sends visitors without a session to the login page', async () => {
    await router.push('/app/dashboard');
    expect(router.currentRoute.value.path).toBe('/');
  });

  it('lets a logged-in user into the app', async () => {
    useStudent().startSession('session-1', { 'Ana Silva': '123' });
    await router.push('/app/dashboard');
    expect(router.currentRoute.value.path).toBe('/app/dashboard');
  });
});

describe('router pages', () => {
  it('has no placeholder pages', () => {
    expect(router.getRoutes().map((r) => r.path)).not.toContain('/app/files');
  });
});
