import type { Period } from './academic';
import { CLASS_TYPE_LABELS, classSeries, type HourMinute, type ScheduleItem } from './schedule';

/*
 * The weekly schedule as an iCalendar (RFC 5545) file, which every calendar app imports:
 * one weekly event per class, in Lisbon time, ending with the period.
 */

const TIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:Europe/Lisbon',
  'BEGIN:STANDARD',
  'DTSTART:19701025T020000',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0000',
  'TZNAME:WET',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'BEGIN:DAYLIGHT',
  'DTSTART:19700329T010000',
  'TZOFFSETFROM:+0000',
  'TZOFFSETTO:+0100',
  'TZNAME:WEST',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'END:VTIMEZONE',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** A date and a class time in Lisbon, as "YYYYMMDDTHHMMSS" (paired with TZID=Europe/Lisbon). */
export const localStamp = (date: Date, hm: HourMinute) =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(hm.hour)}${pad(hm.min)}00`;

/** A moment in UTC, as "YYYYMMDDTHHMMSSZ". */
export const utcStamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');

/** Text with iCalendar's special characters escaped. */
const text = (value: string) => value.replace(/[\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');

/** Lines over 75 bytes are folded onto continuation lines starting with a space. */
const fold = (line: string) => {
  const parts: string[] = [];
  let part = '';
  let bytes = 0;
  for (const char of line) {
    const size = new TextEncoder().encode(char).length;
    if (bytes + size > (parts.length ? 74 : 75)) {
      parts.push(part);
      part = '';
      bytes = 0;
    }
    part += char;
    bytes += size;
  }
  parts.push(part);
  return parts.join('\r\n ');
};

const slug = (value: string) => value.normalize('NFD').replace(/[^A-Za-z0-9]+/g, '-');

export function scheduleToIcs(
  items: ScheduleItem[],
  lectiveYear: string,
  period: Period,
  now = new Date(),
): string {
  const events = items.flatMap((item) => {
    const { first, until } = classSeries(item, lectiveYear, period, now);
    const kind = `${CLASS_TYPE_LABELS[item.class_type]} ${item.class_number}`;
    return [
      'BEGIN:VEVENT',
      // Stable per class, so importing an updated schedule replaces events instead of doubling them
      `UID:${slug(`${lectiveYear}-${period}-${item.weekday}-${localStamp(first, item.time_start).slice(9)}-${item.class}-${item.class_type}${item.class_number}`)}@flip`,
      `DTSTAMP:${utcStamp(now)}`,
      `DTSTART;TZID=Europe/Lisbon:${localStamp(first, item.time_start)}`,
      `DTEND;TZID=Europe/Lisbon:${localStamp(first, item.time_end)}`,
      `RRULE:FREQ=WEEKLY;UNTIL=${utcStamp(until)}`,
      `SUMMARY:${text(item.class)}`,
      `DESCRIPTION:${text(kind)}`,
      `LOCATION:${text(item.location)}`,
      'END:VEVENT',
    ];
  });
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FLIP//Horario//PT',
    'CALSCALE:GREGORIAN',
    ...TIMEZONE,
    ...events,
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}
