import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AppNavbar from './AppNavbar.vue';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

describe('AppNavbar', () => {
  it('leaves the theme to the Settings page', () => {
    const wrapper = mount(AppNavbar);
    expect(wrapper.find('button[title^="Tema"]').exists()).toBe(false);
  });
});
