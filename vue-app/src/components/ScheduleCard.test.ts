import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { invoke } from '@tauri-apps/api/core';
import ScheduleCard from './ScheduleCard.vue';
import { useStudent } from '../composables/useStudent';
import type { ScheduleItem } from '../lib/schedule';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

const item = (over: Partial<ScheduleItem> = {}): ScheduleItem => ({
  weekday: 'Monday',
  time_start: { hour: 9, min: 0 },
  time_end: { hour: 11, min: 0 },
  class: 'Redes',
  class_number: 1,
  location: 'Ed 2: 127',
  class_type: 't',
  ...over,
});

const mountWith = async (schedule: ScheduleItem[]) => {
  vi.mocked(invoke).mockImplementation(async (cmd, args) => {
    if (cmd === 'get_schedule') return schedule;
    if (cmd === 'save_download') return `/home/ana/Downloads/${(args as { name: string }).name}`;
  });
  const wrapper = mount(ScheduleCard, {
    props: { studentId: '123', year: '2025/26', period: 's2' },
    attachTo: document.body,
  });
  await flushPromises();
  return wrapper;
};

describe('ScheduleCard calendar export', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    useStudent().startSession('session-1', { 'Ana Silva': '123' });
  });

  it('saves the whole schedule as one .ics file', async () => {
    const wrapper = await mountWith([item(), item({ weekday: 'Tuesday', class: 'Cálculo' })]);

    await wrapper.get('button[title="Exportar horário para o calendário (.ics)"]').trigger('click');
    await flushPromises();

    const call = vi.mocked(invoke).mock.calls.find(([c]) => c === 'save_download');
    const { name, data } = call![1] as { name: string; data: number[] };
    expect(name).toBe('horario-2026-s2.ics');
    const ics = new TextDecoder().decode(new Uint8Array(data));
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('SUMMARY:Cálculo');
    wrapper.unmount();
  });

  it('opens Google Calendar for one class with a recurrence that ends with the period', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const wrapper = await mountWith([item()]);

    await wrapper.get('button[title="Exportar para Google Calendar"]').trigger('click');

    const url = new URL(open.mock.calls[0][0] as string);
    expect(url.searchParams.get('recur')).toBe('RRULE:FREQ=WEEKLY;UNTIL=20260707T225959Z');
    expect(url.searchParams.get('dates')).toMatch(/^\d{8}T090000\/\d{8}T110000$/);
    expect(url.searchParams.get('ctz')).toBe('Europe/Lisbon');
    expect(url.searchParams.get('details')).toBe('Teórica 1');
    wrapper.unmount();
  });
});
