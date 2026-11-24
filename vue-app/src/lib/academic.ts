/**
 * Converts a displayed academic year into the form the CLIP backend expects.
 *
 * @param yearStr An academic year such as "2024/25".
 * @returns The end year in full form, e.g. "2025". Returns the input unchanged
 *          if it isn't in the "YYYY/YY" format.
 */
export const extractYearForRequest = (yearStr: string): string => {
  const parts = yearStr.split('/');
  if (parts.length === 2) return '20' + parts[1];
  return yearStr;
};

/*
 * FCT's academic calendar: the app's only copy of it. The backend asks for whatever year
 * and period the frontend picks. Dates are 2025/26's, assumed to repeat each year:
 *   1st semester: 2 Sep – 17 Jan
 *   mid-year break: 18 Jan – 22 Feb
 *   2nd semester: 23 Feb – 7 Jul
 * The lective year rolls over on 2 Sep and is named after the year it ends in.
 */
type MonthDay = [month: number, day: number];
const YEAR_START: MonthDay = [9, 2];
const FIRST_SEMESTER_END: MonthDay = [1, 17];
const SECOND_SEMESTER_START: MonthDay = [2, 23];
const SECOND_SEMESTER_END: MonthDay = [7, 7];

export type Period = 's1' | 's2' | 't1' | 't2';

const monthDay = (date: Date) => (date.getMonth() + 1) * 100 + date.getDate();
const md = ([month, day]: MonthDay) => month * 100 + day;

/** Today's semester: the 2nd from 23 Feb until the year rolls over, else the 1st. */
export const currentPeriod = (today = new Date()): Period =>
  monthDay(today) >= md(SECOND_SEMESTER_START) && monthDay(today) < md(YEAR_START) ? 's2' : 's1';

/** Today's lective year as CLIP names it, e.g. "2027" from 2 Sep 2026 to 1 Sep 2027. */
export const currentLectiveYear = (today = new Date()): string =>
  String(today.getFullYear() + (monthDay(today) >= md(YEAR_START) ? 1 : 0));

/**
 * First and last day of a period of a lective year ("2026" for 2025/26). Trimesters have no
 * dates of their own here, so they take their semester's.
 */
export const periodDates = (lectiveYear: string, period: Period): { start: Date; end: Date } => {
  const endYear = Number(lectiveYear);
  const date = (year: number, [month, day]: MonthDay) => new Date(year, month - 1, day);
  return period.endsWith('1')
    ? { start: date(endYear - 1, YEAR_START), end: date(endYear, FIRST_SEMESTER_END) }
    : { start: date(endYear, SECOND_SEMESTER_START), end: date(endYear, SECOND_SEMESTER_END) };
};
