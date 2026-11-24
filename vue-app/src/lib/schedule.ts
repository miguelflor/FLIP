import { periodDates, type Period } from './academic';

export type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type ClassType = 't' | 'p' | 'tp';

export interface HourMinute {
  hour: number;
  min: number;
}

/** A weekly class, as get_schedule returns it. */
export interface ScheduleItem {
  weekday: Weekday;
  time_start: HourMinute;
  time_end: HourMinute;
  class: string;
  class_number: number;
  location: string;
  class_type: ClassType;
}

export const CLASS_TYPE_LABELS: Record<ClassType, string> = {
  t: 'Teórica',
  p: 'Prática',
  tp: 'Teórico-Prática',
};

/** ISO weekday numbers (Mon=1 … Sun=7). */
export const WEEKDAY_INDEX: Record<Weekday, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
};

/** `Date#getDay` uses Sun=0, so it is remapped onto the ISO numbering above. */
export const isoDay = (date: Date) => (date.getDay() === 0 ? 7 : date.getDay());

/**
 * When a class's weekly series starts and ends: from its first day on or after `today` in the
 * period (or the period's start, for a period not under way), until the end of the period's
 * last day in Lisbon. `until` is that moment (22:59:59 UTC is still that day in Lisbon, summer
 * or winter), the same whatever the computer's time zone.
 */
export const classSeries = (
  item: ScheduleItem,
  lectiveYear: string,
  period: Period,
  today = new Date(),
): { first: Date; until: Date } => {
  const { start, end } = periodDates(lectiveYear, period);
  const from = today >= start && today <= end ? today : start;
  const first = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  first.setDate(first.getDate() + ((WEEKDAY_INDEX[item.weekday] - isoDay(first) + 7) % 7));
  const until = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate(), 22, 59, 59));
  return { first, until };
};

const minutes = (hm: HourMinute) => hm.hour * 60 + hm.min;

/** Where a class sits within its day column: column `col` of `cols` side-by-side columns. */
export interface Placement {
  col: number;
  cols: number;
}

/**
 * Side-by-side placement for one day's classes, so classes at overlapping times (e.g. a
 * clash between two units) both show instead of one covering the other. Classes that
 * overlap, directly or through others, share a group; each takes the first free column, and
 * the group is split into as many columns as it needs.
 */
export function layoutDay(items: ScheduleItem[]): Map<ScheduleItem, Placement> {
  const placements = new Map<ScheduleItem, Placement>();
  const sorted = [...items].sort((a, b) => minutes(a.time_start) - minutes(b.time_start));
  let group: ScheduleItem[] = [];
  let columnEnds: number[] = [];
  let groupEnd = -1;

  const closeGroup = () => {
    for (const item of group) placements.get(item)!.cols = columnEnds.length;
    group = [];
    columnEnds = [];
  };

  for (const item of sorted) {
    const start = minutes(item.time_start);
    if (start >= groupEnd) {
      closeGroup();
      groupEnd = start;
    }
    let col = columnEnds.findIndex((end) => end <= start);
    if (col === -1) col = columnEnds.push(0) - 1;
    columnEnds[col] = minutes(item.time_end);
    groupEnd = Math.max(groupEnd, columnEnds[col]);
    placements.set(item, { col, cols: 1 });
    group.push(item);
  }
  closeGroup();
  return placements;
}

const WEEKDAY_LABELS: Record<Weekday, string> = {
  Monday: 'Segunda',
  Tuesday: 'Terça',
  Wednesday: 'Quarta',
  Thursday: 'Quinta',
  Friday: 'Sexta',
  Saturday: 'Sábado',
  Sunday: 'Domingo',
};

/** The days the grid shows: Monday to Friday, plus a weekend day when it has classes. */
export const scheduleDays = (items: ScheduleItem[]): { key: Weekday; label: string }[] =>
  (Object.keys(WEEKDAY_LABELS) as Weekday[])
    .filter((day) => WEEKDAY_INDEX[day] <= 5 || items.some((i) => i.weekday === day))
    .map((key) => ({ key, label: WEEKDAY_LABELS[key] }));
