import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ToastList from './ToastList.vue';
import { useToast } from '../composables/useToast';

describe('ToastList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToast().toasts.value = [];
  });
  afterEach(() => vi.useRealTimers());

  it('announces toasts, errors urgently, and labels the close button', async () => {
    const wrapper = mount(ToastList);
    useToast().success('Guardado');
    useToast().error('Falhou');
    await wrapper.vm.$nextTick();

    expect(wrapper.get('[aria-live]').attributes('aria-live')).toBe('polite');
    expect(wrapper.get('[role="status"]').text()).toContain('Guardado');
    expect(wrapper.get('[role="alert"]').text()).toContain('Falhou');
    expect(wrapper.findAll('button[aria-label="Fechar notificação"]')).toHaveLength(2);
  });

  it('keeps errors up twice as long as other toasts', () => {
    const { toasts, success, error } = useToast();
    success('Guardado');
    error('Falhou');

    vi.advanceTimersByTime(3500);
    expect(toasts.value.map((t) => t.message)).toEqual(['Falhou']);
    vi.advanceTimersByTime(3000);
    expect(toasts.value).toEqual([]);
  });
});
