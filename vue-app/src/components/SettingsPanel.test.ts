import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { invoke } from '@tauri-apps/api/core';
import SettingsPanel from './SettingsPanel.vue';
import { useToast } from '../composables/useToast';
import { useTheme } from '../composables/useTheme';
import { usePreload } from '../composables/usePreload';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

/** The radio buttons of the choice group with this legend. */
const choices = (wrapper: ReturnType<typeof mount>, legend: string) =>
  wrapper
    .findAll('fieldset')
    .find((f) => f.get('legend').text() === legend)!
    .findAll('input[type="radio"]');

const answer = (current: string | null, chosen: string | null, login: string | null = null) =>
  vi.mocked(invoke).mockImplementation(async (cmd) => {
    if (cmd === 'get_download_dir') return current;
    if (cmd === 'change_download_dir') return chosen;
    if (cmd === 'saved_login') return login;
  });

describe('SettingsPanel download folder', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    useToast().toasts.value = [];
  });

  it('says the folder will be asked for when none is chosen yet', async () => {
    answer(null, null);
    const wrapper = mount(SettingsPanel);
    await flushPromises();
    expect(wrapper.get('[data-testid="download-folder"]').text()).toContain('será pedida na primeira transferência');
    expect(wrapper.get('[data-testid="change-folder"]').text()).toBe('Escolher pasta');
  });

  it('shows the chosen folder and changes it', async () => {
    answer('/home/ana/Downloads', '/home/ana/Aulas');
    const wrapper = mount(SettingsPanel);
    await flushPromises();
    expect(wrapper.get('[data-testid="download-folder"]').text()).toBe('/home/ana/Downloads');

    await wrapper.get('[data-testid="change-folder"]').trigger('click');
    await flushPromises();

    expect(invoke).toHaveBeenCalledWith('change_download_dir');
    expect(wrapper.get('[data-testid="download-folder"]').text()).toBe('/home/ana/Aulas');
    expect(useToast().toasts.value.map((t) => t.message)).toEqual(['Pasta de transferências alterada']);
  });

  it('keeps the folder when the picker is closed', async () => {
    answer('/home/ana/Downloads', null);
    const wrapper = mount(SettingsPanel);
    await flushPromises();
    await wrapper.get('[data-testid="change-folder"]').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="download-folder"]').text()).toBe('/home/ana/Downloads');
    expect(useToast().toasts.value).toEqual([]);
  });
});

describe('SettingsPanel theme', () => {
  it('offers light, dark and system themes, and applies the one picked', async () => {
    vi.mocked(invoke).mockResolvedValue(null);
    useTheme().setTheme('system');
    const wrapper = mount(SettingsPanel, { attachTo: document.body });
    await flushPromises();

    const radios = choices(wrapper, 'Tema');
    expect(radios.map((r) => r.element.parentElement!.textContent!.trim())).toEqual(['Claro', 'Escuro', 'Sistema']);
    expect((radios[2].element as HTMLInputElement).checked).toBe(true);

    await radios[1].setValue(true);
    expect(useTheme().theme.value).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    wrapper.unmount();
  });
});

describe('SettingsPanel cache', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset().mockResolvedValue(null);
    useToast().toasts.value = [];
  });

  it('clears the cache', async () => {
    const wrapper = mount(SettingsPanel);
    await flushPromises();
    await wrapper.get('[data-testid="clear-cache"]').trigger('click');
    await flushPromises();
    expect(invoke).toHaveBeenCalledWith('reset_cache');
    expect(useToast().toasts.value.map((t) => t.message)).toEqual(['Cache limpa com sucesso']);
  });

  it('says when clearing failed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(invoke).mockImplementation(async (cmd) => {
      if (cmd === 'reset_cache') throw 'Erro ao aceder à cache local';
      return null;
    });
    const wrapper = mount(SettingsPanel);
    await flushPromises();
    await wrapper.get('[data-testid="clear-cache"]').trigger('click');
    await flushPromises();
    expect(useToast().toasts.value.map((t) => t.message)).toEqual(['Erro ao limpar cache']);
  });
});

describe('SettingsPanel saved login', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    useToast().toasts.value = [];
  });

  it('shows whose login is saved and forgets it without logging out', async () => {
    answer(null, null, 'a.silva');
    const wrapper = mount(SettingsPanel);
    await flushPromises();
    expect(wrapper.get('[data-testid="saved-login"]').text()).toContain('a.silva');

    await wrapper.get('[data-testid="forget-login"]').trigger('click');
    await flushPromises();

    expect(invoke).toHaveBeenCalledWith('forget_login');
    expect(vi.mocked(invoke).mock.calls.map(([c]) => c)).not.toContain('logout');
    expect(wrapper.get('[data-testid="saved-login"]').text()).toContain('Nenhum início de sessão guardado');
    expect(wrapper.find('[data-testid="forget-login"]').exists()).toBe(false);
    expect(useToast().toasts.value.map((t) => t.message)).toEqual(['Início de sessão esquecido']);
  });

  it('explains how to save a login when none is', async () => {
    answer(null, null, null);
    const wrapper = mount(SettingsPanel);
    await flushPromises();
    expect(wrapper.get('[data-testid="saved-login"]').text()).toContain('Lembrar-me neste computador');
  });
});

describe('SettingsPanel file preloading', () => {
  it('offers the three preload choices and keeps the one picked', async () => {
    vi.mocked(invoke).mockResolvedValue(null);
    usePreload().setPreload('period');
    const wrapper = mount(SettingsPanel);
    await flushPromises();

    const radios = choices(wrapper, 'Carregar antecipadamente');
    expect(radios.map((r) => r.element.parentElement!.textContent!.trim())).toEqual([
      'Período selecionado',
      'Todos os períodos',
      'Nenhum',
    ]);
    expect((radios[0].element as HTMLInputElement).checked).toBe(true);

    await radios[2].setValue(true);
    expect(usePreload().preload.value).toBe('none');
    expect(localStorage.getItem('preload_files')).toBe('none');
  });
});

describe('SettingsPanel language', () => {
  it('switches the language of everything on screen', async () => {
    vi.mocked(invoke).mockResolvedValue(null);
    const { useLanguage } = await import('../lib/i18n');
    useLanguage().setLanguage('system');
    const wrapper = mount(SettingsPanel);
    await flushPromises();

    const radios = choices(wrapper, 'Idioma');
    expect(radios.map((r) => r.element.parentElement!.textContent!.trim())).toEqual(['Português', 'English', 'Sistema']);

    await radios[1].setValue(true);
    expect(wrapper.text()).toContain('Appearance');
    expect(choices(wrapper, 'Language')).toHaveLength(3);
    expect(document.documentElement.lang).toBe('en');
    useLanguage().setLanguage('system');
  });
});
