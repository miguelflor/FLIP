import { describe, expect, it } from 'vitest';
import { layoutDay, scheduleDays, type ScheduleItem } from './schedule';

const at = (start: string, end: string, weekday: ScheduleItem['weekday'] = 'Monday'): ScheduleItem => {
  const hm = (t: string) => ({ hour: Number(t.slice(0, 2)), min: Number(t.slice(3)) });
  return {
    weekday,
    time_start: hm(start),
    time_end: hm(end),
    class: `${start}-${end}`,
    class_number: 1,
    location: '',
    class_type: 't',
  };
};

const placed = (items: ScheduleItem[]) => {
  const layout = layoutDay(items);
  return items.map((i) => [i.class, layout.get(i)!.col, layout.get(i)!.cols]);
};

describe('layoutDay', () => {
  it('gives classes that never overlap the full width', () => {
    expect(placed([at('09:00', '11:00'), at('11:00', '13:00')])).toEqual([
      ['09:00-11:00', 0, 1],
      ['11:00-13:00', 0, 1],
    ]);
  });

  it('puts clashing classes side by side', () => {
    expect(placed([at('09:00', '11:00'), at('10:00', '12:00')])).toEqual([
      ['09:00-11:00', 0, 2],
      ['10:00-12:00', 1, 2],
    ]);
  });

  it('reuses a column once it is free, within one group of overlaps', () => {
    // A overlaps B and C, which follow each other: B and C share a column
    expect(placed([at('09:00', '13:00'), at('09:00', '10:30'), at('10:30', '12:00')])).toEqual([
      ['09:00-13:00', 0, 2],
      ['09:00-10:30', 1, 2],
      ['10:30-12:00', 1, 2],
    ]);
  });

  it('sizes each group of overlaps on its own', () => {
    const items = [at('09:00', '10:00'), at('09:00', '10:00'), at('09:00', '10:00'), at('14:00', '15:00')];
    expect(placed(items).map(([, col, cols]) => [col, cols])).toEqual([
      [0, 3],
      [1, 3],
      [2, 3],
      [0, 1],
    ]);
  });
});

describe('scheduleDays', () => {
  it('shows Monday to Friday, plus weekend days that have classes', () => {
    expect(scheduleDays([at('09:00', '10:00')]).map((d) => d.label)).toEqual([
      'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta',
    ]);
    expect(scheduleDays([at('09:00', '10:00', 'Saturday')]).map((d) => d.key)).toContain('Saturday');
    expect(scheduleDays([at('09:00', '10:00', 'Saturday')]).map((d) => d.key)).not.toContain('Sunday');
  });
});
