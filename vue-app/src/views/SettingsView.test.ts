import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { invoke } from '@tauri-apps/api/core';
import SettingsView from './SettingsView.vue';
import { useToast } from '../composables/useToast';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

const answer = (current: string | null, chosen: string | null) =>
  vi.mocked(invoke).mockImplementation(async (cmd) => {
    if (cmd === 'get_download_dir') return current;
    if (cmd === 'change_download_dir') return chosen;
  });

describe('SettingsView download folder', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    useToast().toasts.value = [];
  });

  it('says the folder will be asked for when none is chosen yet', async () => {
    answer(null, null);
    const wrapper = mount(SettingsView);
    await flushPromises();
    expect(wrapper.get('[data-testid="download-folder"]').text()).toContain('será pedida na primeira transferência');
    expect(wrapper.get('button').text()).toBe('Escolher pasta');
  });

  it('shows the chosen folder and changes it', async () => {
    answer('/home/ana/Downloads', '/home/ana/Aulas');
    const wrapper = mount(SettingsView);
    await flushPromises();
    expect(wrapper.get('[data-testid="download-folder"]').text()).toBe('/home/ana/Downloads');

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(invoke).toHaveBeenCalledWith('change_download_dir');
    expect(wrapper.get('[data-testid="download-folder"]').text()).toBe('/home/ana/Aulas');
    expect(useToast().toasts.value.map((t) => t.message)).toEqual(['Pasta de transferências alterada']);
  });

  it('keeps the folder when the picker is closed', async () => {
    answer('/home/ana/Downloads', null);
    const wrapper = mount(SettingsView);
    await flushPromises();
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="download-folder"]').text()).toBe('/home/ana/Downloads');
    expect(useToast().toasts.value).toEqual([]);
  });
});
