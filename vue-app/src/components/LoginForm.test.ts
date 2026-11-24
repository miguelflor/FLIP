import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { invoke } from '@tauri-apps/api/core';
import LoginForm from './LoginForm.vue';
import { useToast } from '../composables/useToast';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

const mountForm = () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:p(.*)*', component: { template: '<div />' } }],
  });
  return mount(LoginForm, { global: { plugins: [router] } });
};

describe('LoginForm', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    useToast().toasts.value = [];
  });

  it('keeps the username and clears the password after a failed login', async () => {
    vi.mocked(invoke).mockRejectedValue('Identificador ou senha incorretos');
    const wrapper = mountForm();
    await wrapper.get('#username').setValue('a.silva');
    await wrapper.get('#password').setValue('wrong');

    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect((wrapper.get('#username').element as HTMLInputElement).value).toBe('a.silva');
    expect((wrapper.get('#password').element as HTMLInputElement).value).toBe('');
    expect(useToast().toasts.value.map((t) => t.message)).toEqual(['Identificador ou senha incorretos']);
  });

  it('lets password managers recognise the fields, and locks them while logging in', async () => {
    let finish!: (v: unknown) => void;
    vi.mocked(invoke).mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const wrapper = mountForm();
    expect(wrapper.get('#username').attributes('autocomplete')).toBe('username');
    expect(wrapper.get('#password').attributes('autocomplete')).toBe('current-password');

    await wrapper.get('#username').setValue('a.silva');
    await wrapper.get('#password').setValue('pw');
    await wrapper.get('form').trigger('submit');

    expect(wrapper.get('#username').attributes('disabled')).toBeDefined();
    expect(wrapper.get('#password').attributes('disabled')).toBeDefined();
    finish({ session_id: 's', aluno_ids: { 'Ana Silva': '1' } });
    await flushPromises();
  });
});
