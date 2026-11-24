import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { invoke } from '@tauri-apps/api/core';
import LoginView from './LoginView.vue';
import { useStudent } from '../composables/useStudent';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

const mountView = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: LoginView },
      { path: '/app/dashboard', component: { template: '<div />' } },
    ],
  });
  await router.push('/');
  const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } });
  await flushPromises();
  return { wrapper, router };
};

describe('LoginView', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    useStudent().endSession();
  });

  it('shows just the form when no login is saved', async () => {
    vi.mocked(invoke).mockResolvedValue(null);
    const { wrapper } = await mountView();
    expect(wrapper.find('form').exists()).toBe(true);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('explains a failed automatic login, and retries it on request', async () => {
    vi.mocked(invoke).mockRejectedValueOnce('Não foi possível contactar o CLIP.');
    const { wrapper, router } = await mountView();

    expect(wrapper.get('[role="alert"]').text()).toContain('Não foi possível contactar o CLIP.');
    expect(wrapper.find('form').exists()).toBe(true);

    vi.mocked(invoke).mockResolvedValueOnce({ session_id: 's', aluno_ids: { 'Ana Silva': '1' } });
    await wrapper.get('[role="alert"] button').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/app/dashboard');
  });
});
