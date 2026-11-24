import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { invoke } from '@tauri-apps/api/core';
import DocView from './DocView.vue';
import { useStudent } from '../composables/useStudent';
import { usePreload } from '../composables/usePreload';
import { forgetCourseFiles } from '../composables/useCourseFiles';

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

  it('preloads the units the preload setting asks for', async () => {
    const unit = (id: string, p: string) => ({
      text: `U${id}`,
      href: `/u?unidade=${id}&per%EDodo_lectivo=${p}&tipo_de_per%EDodo_lectivo=s`,
    });
    vi.mocked(invoke).mockReset().mockImplementation(async (cmd) => {
      if (cmd === 'get_chairs') return { success: true, chairs: { s1: [unit('1', '1')], s2: [unit('2', '2')], t1: [], t2: [] } };
      if (cmd === 'list_files') return [];
    });
    useStudent().startSession('session-1', { 'Ana Silva': '123' });
    const listed = async (choice: 'period' | 'all' | 'none') => {
      forgetCourseFiles();
      vi.mocked(invoke).mockClear();
      usePreload().setPreload(choice);
      const wrapper = mount(DocView, { props: { studentId: '123', year: '2025/26', period: 's1' } });
      await flushPromises();
      wrapper.unmount();
      return vi.mocked(invoke).mock.calls.filter(([c]) => c === 'list_files').length;
    };

    expect(await listed('period')).toBe(1);
    expect(await listed('all')).toBe(2);
    expect(await listed('none')).toBe(0);
    usePreload().setPreload('period');
  });
});
