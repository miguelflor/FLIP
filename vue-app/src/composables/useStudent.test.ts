import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import errorsRs from '../../../src-tauri/src/errors.rs?raw';
import { SESSION_EXPIRED, invokeClip, useStudent } from './useStudent';
import { useToast } from './useToast';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

describe('invokeClip', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset().mockResolvedValue(undefined);
    useToast().toasts.value = [];
    useStudent().startSession('session-1', { 'Ana Silva': '123' });
  });

  it('matches the message the backend sends for an expired session', () => {
    expect(errorsRs).toContain(`SESSION_EXPIRED: &str = "${SESSION_EXPIRED}"`);
  });

  it('ends the session, once, when the backend says it expired', async () => {
    vi.mocked(invoke).mockRejectedValue(SESSION_EXPIRED);
    await expect(invokeClip('get_tests')).rejects.toBe(SESSION_EXPIRED);
    await expect(invokeClip('get_schedule')).rejects.toBe(SESSION_EXPIRED);

    expect(useStudent().sessionId.value).toBeNull();
    expect(useToast().toasts.value.map((t) => t.message)).toEqual([SESSION_EXPIRED]);
  });

  it('keeps the session on any other error', async () => {
    vi.mocked(invoke).mockRejectedValue('O CLIP respondeu com um erro (500)');
    await expect(invokeClip('get_tests')).rejects.toBeTruthy();
    expect(useStudent().sessionId.value).toBe('session-1');
  });
});
