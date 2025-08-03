/**
 * 
 * @returns The current academic year as a string.
 */
export const getCurrentAcademicYear= (): string => {
  const now = new Date();
  return (now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear()).toString();
};



