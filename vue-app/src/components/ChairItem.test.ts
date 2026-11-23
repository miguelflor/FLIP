import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { invoke } from '@tauri-apps/api/core';
import ChairItem from './ChairItem.vue';
import { useStudent } from '../composables/useStudent';
import { storage } from '../lib/storage';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

const chair = {
  text: 'Redes de Computadores',
  href: '/utente/eu/aluno/ano_lectivo/unidades?ano_lectivo=2026&per%EDodo_lectivo=1&tipo_de_per%EDodo_lectivo=s&unidade=42&aluno=123',
};

const file = {
  name: 'Aula 1.pdf',
  type_name: 'Outros',
  href: '/objecto?oid=1&oin=Aula%201.pdf',
  date: '2026.09.14',
  size: '1 Kb',
  uploader: 'Ana',
};

/** Answers list_files from `listFiles`; other commands resolve with nothing. */
const answer = (listFiles: () => Promise<unknown>) =>
  vi.mocked(invoke).mockImplementation(async (cmd) => (cmd === 'list_files' ? listFiles() : undefined));

describe('ChairItem file listing', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    storage.set('selectedYear', '2025/26');
    useStudent().startSession('session-1', { 'Ana Silva': '123' });
  });

  it('shows a failed listing as an error with a retry, not as "no files"', async () => {
    answer(() => Promise.reject('O CLIP respondeu com um erro (503)'));
    const wrapper = mount(ChairItem, { props: { chair, query: '' } });
    await flushPromises();

    await wrapper.get('button[aria-expanded]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('O CLIP respondeu com um erro (503)');
    expect(wrapper.text()).not.toContain('não tem ficheiros');

    answer(() => Promise.resolve([file]));
    await wrapper.get('[role="alert"] button').trigger('click');
    await flushPromises();

    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('Aula 1.pdf');
  });

  it('says a unit has no files only when the listing succeeded empty', async () => {
    answer(() => Promise.resolve([]));
    const wrapper = mount(ChairItem, { props: { chair, query: '' } });
    await flushPromises();

    await wrapper.get('button[aria-expanded]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Esta cadeira não tem ficheiros.');
  });
});
