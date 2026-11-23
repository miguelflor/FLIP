import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { invoke } from '@tauri-apps/api/core';
import AppSidebar from './AppSidebar.vue';
import { useStudent } from '../composables/useStudent';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

const makeRouter = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'login', component: { template: '<div />' } },
      { path: '/app/dashboard', name: 'dashboard', component: { template: '<div />' } },
    ],
  });
  await router.push('/app/dashboard');
  return router;
};

describe('AppSidebar logout', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset().mockResolvedValue(undefined);
    useStudent().startSession('session-1', { 'Ana Silva': '123' });
  });

  it('ends the backend session, clears the local one and returns to login', async () => {
    const router = await makeRouter();
    const wrapper = mount(AppSidebar, { props: { open: true }, global: { plugins: [router] } });

    await wrapper.get('button[title="Terminar sessão"]').trigger('click');
    await flushPromises();

    expect(invoke).toHaveBeenCalledWith('logout', { sessionId: 'session-1' });
    expect(useStudent().sessionId.value).toBeNull();
    expect(router.currentRoute.value.path).toBe('/');
  });

  it('still logs out locally when the backend call fails', async () => {
    vi.mocked(invoke).mockImplementation(async (cmd) => {
      if (cmd === 'logout') throw new Error('boom');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const router = await makeRouter();
    const wrapper = mount(AppSidebar, { props: { open: true }, global: { plugins: [router] } });

    await wrapper.get('button[title="Terminar sessão"]').trigger('click');
    await flushPromises();

    expect(useStudent().sessionId.value).toBeNull();
    expect(router.currentRoute.value.path).toBe('/');
  });
});
