import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { computed, ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { useClipQuery } from './useClipQuery';
import { useStudent } from './useStudent';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

const callsOf = (command: string) => vi.mocked(invoke).mock.calls.filter(([c]) => c === command);

describe('useClipQuery', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    vi.mocked(invoke).mockImplementation(async (cmd) => (cmd === 'get_chairs' ? { success: true } : undefined));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    useStudent().startSession('session-1', { 'Ana Silva': '123' });
  });

  it('shares one backend request between panels asking for the same data', async () => {
    const a = useClipQuery('get_chairs', ref('123'), ref('2025/26'));
    const b = useClipQuery('get_chairs', ref('123'), ref('2025/26'));
    await flushPromises();

    expect(callsOf('get_chairs')).toHaveLength(1);
    expect(a.data.value).toEqual({ success: true });
    expect(b.data.value).toEqual({ success: true });
  });

  it('sends different requests separately, and again once the first has finished', async () => {
    useClipQuery('get_chairs', ref('123'), ref('2025/26'));
    useClipQuery('get_chairs', ref('123'), ref('2024/25'));
    await flushPromises();
    expect(callsOf('get_chairs')).toHaveLength(2);

    useClipQuery('get_chairs', ref('123'), ref('2025/26'));
    await flushPromises();
    expect(callsOf('get_chairs')).toHaveLength(3);
  });

  it('waits for a year and period instead of running without them', async () => {
    const year = ref<string | null>(null);
    const period = ref<string | null>(null);
    const q = useClipQuery('get_schedule', ref('123'), year, {
      params: computed(() => ({ period: period.value })),
    });
    await flushPromises();
    expect(callsOf('get_schedule')).toHaveLength(0);
    expect(q.loading.value).toBe(true);

    year.value = '2025/26';
    await flushPromises();
    expect(callsOf('get_schedule')).toHaveLength(0);

    period.value = 's2';
    await flushPromises();
    expect(callsOf('get_schedule')).toEqual([
      ['get_schedule', { sessionId: 'session-1', studentId: '123', useCache: true, year: '2026', period: 's2' }],
    ]);
  });

  it('runs commands that take no year straight away', async () => {
    useClipQuery('get_available_years', ref('123'), null);
    await flushPromises();
    expect(callsOf('get_available_years')).toEqual([
      ['get_available_years', { sessionId: 'session-1', studentId: '123', useCache: true }],
    ]);
  });
});
