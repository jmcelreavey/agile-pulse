/** Add working days (Monday to Friday) to a date. Whole days only; fractions round up. */
export function addWorkingDays(from: Date, days: number): Date {
  const date = new Date(from.getTime());
  let remaining = Math.ceil(Math.max(0, days));
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    const weekday = date.getUTCDay();
    if (weekday !== 0 && weekday !== 6) remaining--;
  }
  while (date.getUTCDay() === 0 || date.getUTCDay() === 6) date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

/** The calendar date of sprint day `day` (1-based) for a sprint that started on `startedAt`. */
export function dateOfSprintDay(startedAt: Date, day: number): Date {
  return addWorkingDays(startedAt, Math.max(0, day - 1));
}

export const formatDate = (date: Date) =>
  date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
