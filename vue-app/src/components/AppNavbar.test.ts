import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { invoke } from '@tauri-apps/api/core';
import AppNavbar from './AppNavbar.vue';
import { useStudent } from '../composables/useStudent';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

const mountNavbar = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/app/dashboard', component: { template: '<div />' } },
    ],
  });
  await router.push('/app/dashboard');
  const wrapper = mount(AppNavbar, { global: { plugins: [router] }, attachTo: document.body });
  return { wrapper, router };
};

const dialog = (wrapper: Awaited<ReturnType<typeof mountNavbar>>['wrapper']) =>
  wrapper.get('dialog').element as HTMLDialogElement;

describe('AppNavbar', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset().mockResolvedValue(null);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    useStudent().startSession('session-1', { 'Ana Silva': '123' });
  });

  it('leaves the theme to the settings', async () => {
    const { wrapper } = await mountNavbar();
    expect(wrapper.find('button[title^="Tema"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('opens the settings as a modal, loading them fresh each time', async () => {
    const { wrapper } = await mountNavbar();
    expect(dialog(wrapper).open).toBe(false);
    expect(wrapper.text()).not.toContain('Aparência');

    await wrapper.get('button[title="Definições"]').trigger('click');
    await flushPromises();
    expect(dialog(wrapper).open).toBe(true);
    expect(wrapper.text()).toContain('Aparência');
    expect(invoke).toHaveBeenCalledWith('get_download_dir');

    await wrapper.get('button[aria-label="Fechar definições"]').trigger('click');
    await flushPromises();
    expect(dialog(wrapper).open).toBe(false);

    vi.mocked(invoke).mockClear();
    await wrapper.get('button[title="Definições"]').trigger('click');
    await flushPromises();
    expect(invoke).toHaveBeenCalledWith('get_download_dir');
    wrapper.unmount();
  });

  it('closes the settings on Escape and on a click outside them', async () => {
    const { wrapper } = await mountNavbar();
    await wrapper.get('button[title="Definições"]').trigger('click');
    await flushPromises();

    // Escape: the browser closes the dialog and fires "close"
    dialog(wrapper).close();
    await flushPromises();
    expect(wrapper.text()).not.toContain('Aparência');

    await wrapper.get('button[title="Definições"]').trigger('click');
    await flushPromises();
    // A click on the dialog element itself is a click on its backdrop
    await wrapper.get('dialog').trigger('click');
    await flushPromises();
    expect(dialog(wrapper).open).toBe(false);

    // A click inside keeps it open
    await wrapper.get('button[title="Definições"]').trigger('click');
    await flushPromises();
    await wrapper.get('#settings-title').trigger('click');
    expect(dialog(wrapper).open).toBe(true);
    wrapper.unmount();
  });

  it('logs out: ends the backend session, clears the local one, returns to login', async () => {
    const { wrapper, router } = await mountNavbar();
    await wrapper.get('button[title="Terminar sessão"]').trigger('click');
    await flushPromises();

    expect(invoke).toHaveBeenCalledWith('logout', { sessionId: 'session-1' });
    expect(useStudent().sessionId.value).toBeNull();
    expect(router.currentRoute.value.path).toBe('/');
    wrapper.unmount();
  });

  it('still logs out locally when the backend call fails', async () => {
    vi.mocked(invoke).mockImplementation(async (cmd) => {
      if (cmd === 'logout') throw new Error('boom');
    });
    const { wrapper, router } = await mountNavbar();
    await wrapper.get('button[title="Terminar sessão"]').trigger('click');
    await flushPromises();

    expect(useStudent().sessionId.value).toBeNull();
    expect(router.currentRoute.value.path).toBe('/');
    wrapper.unmount();
  });
});
