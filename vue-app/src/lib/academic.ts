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
