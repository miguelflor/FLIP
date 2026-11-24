import { describe, expect, it } from 'vitest';
import { scheduleToIcs } from './ics';
import { classSeries, type ScheduleItem } from './schedule';

const redes: ScheduleItem = {
  weekday: 'Wednesday',
  time_start: { hour: 9, min: 30 },
  time_end: { hour: 11, min: 0 },
  class: 'Redes de Computadores',
  class_number: 2,
  location: 'Ed 2: 127, Ed.II',
  class_type: 'tp',
};

const iso = (d: Date) => d.toLocaleDateString('sv');

describe('classSeries', () => {
  it('starts on the next class day during the period, and ends with it', () => {
    // Monday 2 Mar 2026, in the 2nd semester of 2025/26
    const { first, until } = classSeries(redes, '2026', 's2', new Date(2026, 2, 2, 15));
    expect(iso(first)).toBe('2026-03-04');
    expect(until.toISOString()).toBe('2026-07-07T22:59:59.000Z');
  });

  it('starts on class day itself when that is today', () => {
    expect(iso(classSeries(redes, '2026', 's2', new Date(2026, 2, 4, 20)).first)).toBe('2026-03-04');
  });

  it('starts at the beginning of a period that is not under way', () => {
    // Exported in January for the 2nd semester, which begins Monday 23 Feb
    expect(iso(classSeries(redes, '2026', 's2', new Date(2026, 0, 10)).first)).toBe('2026-02-25');
  });
});

describe('scheduleToIcs', () => {
  const ics = scheduleToIcs([redes], '2026', 's2', new Date(Date.UTC(2026, 2, 2, 10)));
  const unfolded = ics.replace(/\r\n /g, '');
  const lines = unfolded.split('\r\n');

  it('is a calendar with one weekly event per class, in Lisbon time, ending with the period', () => {
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    expect(lines.filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(1);
    expect(lines).toContain('TZID:Europe/Lisbon');
    expect(lines).toContain('DTSTART;TZID=Europe/Lisbon:20260304T093000');
    expect(lines).toContain('DTEND;TZID=Europe/Lisbon:20260304T110000');
    expect(lines).toContain('RRULE:FREQ=WEEKLY;UNTIL=20260707T225959Z');
    expect(lines).toContain('DTSTAMP:20260302T100000Z');
  });

  it('escapes text and labels the class type', () => {
    expect(lines).toContain('SUMMARY:Redes de Computadores');
    expect(lines).toContain('DESCRIPTION:Teórico-Prática 2');
    expect(lines).toContain('LOCATION:Ed 2: 127\\, Ed.II');
  });

  it('uses CRLF line endings and folds long lines at 75 bytes', () => {
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toContain('\n');
    const long = scheduleToIcs([{ ...redes, class: 'Época '.repeat(30) }], '2026', 's2');
    for (const line of long.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(long.replace(/\r\n /g, '')).toContain(`SUMMARY:${'Época '.repeat(30)}`);
  });

  it('gives each class a stable id, so re-importing updates it', () => {
    const again = scheduleToIcs([redes], '2026', 's2', new Date(Date.UTC(2026, 2, 3)));
    const uid = (s: string) => s.replace(/\r\n /g, '').split('\r\n').find((l) => l.startsWith('UID:'));
    expect(uid(again)).toBe(uid(ics));
    expect(uid(ics)).toMatch(/^UID:[A-Za-z0-9-]+@flip$/);
  });
});
