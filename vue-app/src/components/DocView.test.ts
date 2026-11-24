import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { invoke } from '@tauri-apps/api/core';
import DocView from './DocView.vue';
import { useStudent } from '../composables/useStudent';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

describe('DocView', () => {
  it('only puts list items directly inside lists', async () => {
    const unit = { text: 'Redes', href: '/u?unidade=1&per%EDodo_lectivo=1&tipo_de_per%EDodo_lectivo=s' };
    vi.mocked(invoke).mockImplementation(async (cmd) => {
      if (cmd === 'get_chairs') return { success: true, chairs: { s1: [unit], s2: [], t1: [], t2: [] } };
      if (cmd === 'list_files') return [];
    });
    useStudent().startSession('session-1', { 'Ana Silva': '123' });
    const wrapper = mount(DocView, { props: { studentId: '123', year: '2025/26', period: 's1' } });
    await flushPromises();

    expect(wrapper.text()).toContain('Redes');
    expect(wrapper.find('input[type="search"]').exists()).toBe(true);
    for (const list of wrapper.findAll('ul')) {
      for (const child of list.element.children) expect(child.tagName).toBe('LI');
    }
  });
});
