import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { invoke } from '@tauri-apps/api/core';
import AppLayout from './AppLayout.vue';
import { useStudent } from '../composables/useStudent';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

describe('AppLayout', () => {
  it('returns to the login page when the session ends while it is open', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {} });
    useStudent().startSession('session-1', { 'Ana Silva': '123' });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/app', component: AppLayout, children: [{ path: '', component: { template: '<div />' } }] },
      ],
    });
    await router.push('/app');
    mount({ template: '<RouterView />' }, { global: { plugins: [router] } });
    await flushPromises();

    useStudent().endSession();
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/');
  });
});
