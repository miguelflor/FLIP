import { describe, expect, it } from 'vitest';
import { currentLectiveYear, currentPeriod, extractYearForRequest, periodDates } from './academic';

const day = (iso: string) => new Date(`${iso}T12:00`);

describe('extractYearForRequest', () => {
  it('turns a displayed year into the end year CLIP expects', () => {
    expect(extractYearForRequest('2025/26')).toBe('2026');
  });

  it('passes anything else through', () => {
    expect(extractYearForRequest('2026')).toBe('2026');
  });
});

describe('academic calendar', () => {
  it.each([
    ['2025-09-01', 's2', '2025'],
    ['2025-09-02', 's1', '2026'],
    ['2025-12-31', 's1', '2026'],
    ['2026-01-17', 's1', '2026'],
    ['2026-02-10', 's1', '2026'], // mid-year break still shows the 1st semester
    ['2026-02-23', 's2', '2026'],
    ['2026-07-07', 's2', '2026'],
    ['2026-08-15', 's2', '2026'],
  ])('on %s it is %s of %s', (date, period, year) => {
    expect(currentPeriod(day(date))).toBe(period);
    expect(currentLectiveYear(day(date))).toBe(year);
  });

  it('dates each period of a lective year', () => {
    const iso = (d: Date) => d.toLocaleDateString('sv');
    const s1 = periodDates('2026', 's1');
    const s2 = periodDates('2026', 's2');
    expect([iso(s1.start), iso(s1.end)]).toEqual(['2025-09-02', '2026-01-17']);
    expect([iso(s2.start), iso(s2.end)]).toEqual(['2026-02-23', '2026-07-07']);
    expect(periodDates('2026', 't2')).toEqual(s2);
  });
});
