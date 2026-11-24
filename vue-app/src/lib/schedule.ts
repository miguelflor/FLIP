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
