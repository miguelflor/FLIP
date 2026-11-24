import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseDropdown from './BaseDropdown.vue';

const mountDropdown = (selected: string | null = '2024/25') =>
  mount(BaseDropdown, {
    props: { options: ['2025/26', '2024/25', '2023/24'], selected, placeholder: 'Selecionar ano' },
    attachTo: document.body,
  });

const focused = () => document.activeElement?.textContent?.trim();

describe('BaseDropdown', () => {
  it('exposes its state to assistive technology', async () => {
    const wrapper = mountDropdown();
    const button = wrapper.get('button[aria-haspopup="listbox"]');
    expect(button.attributes('aria-expanded')).toBe('false');

    await button.trigger('click');
    expect(button.attributes('aria-expanded')).toBe('true');
    const options = wrapper.findAll('[role="listbox"] [role="option"]');
    expect(options.map((o) => o.attributes('aria-selected'))).toEqual(['false', 'true', 'false']);
    wrapper.unmount();
  });

  it('opens on the selected option with the arrow keys and moves through the list', async () => {
    const wrapper = mountDropdown();
    await wrapper.get('button[aria-haspopup]').trigger('keydown', { key: 'ArrowDown' });
    expect(focused()).toBe('2024/25');

    const list = wrapper.get('[role="listbox"]');
    await list.trigger('keydown', { key: 'ArrowDown' });
    expect(focused()).toBe('2023/24');
    await list.trigger('keydown', { key: 'ArrowDown' });
    expect(focused()).toBe('2025/26'); // wraps around
    await list.trigger('keydown', { key: 'End' });
    expect(focused()).toBe('2023/24');
    await list.trigger('keydown', { key: 'Home' });
    expect(focused()).toBe('2025/26');
    wrapper.unmount();
  });

  it('closes on Escape, back onto its button', async () => {
    const wrapper = mountDropdown(null);
    const button = wrapper.get('button[aria-haspopup]');
    await button.trigger('keydown', { key: 'ArrowDown' });
    expect(focused()).toBe('2025/26');

    await wrapper.get('[role="listbox"]').trigger('keydown', { key: 'Escape' });
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
    expect(document.activeElement).toBe(button.element);
    wrapper.unmount();
  });

  it('emits the chosen option and closes', async () => {
    const wrapper = mountDropdown();
    await wrapper.get('button[aria-haspopup]').trigger('click');
    await wrapper.findAll('[role="option"]')[2].trigger('click');
    expect(wrapper.emitted('select')).toEqual([['2023/24']]);
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
    wrapper.unmount();
  });
});
