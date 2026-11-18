/**
 * How much to write in each day column of the chart header, by how wide
 * the column is on screen. A 14-day sprint on a phone gets ~20px columns,
 * which fit a day number but not "WED" plus a zoom button.
 */
export type DayLabelMode = "full" | "short" | "number" | "sparse";

export const dayLabelMode = (columnWidthPx: number): DayLabelMode => {
  if (columnWidthPx >= 56) return "full"; // "WED" and the zoom button
  if (columnWidthPx >= 34) return "short"; // "WED", smaller, no button
  if (columnWidthPx >= 16) return "number"; // "7"
  return "sparse"; // "1", "3", "5"... so numbers never touch
};

export const dayLabelText = (
  mode: DayLabelMode,
  day: { day: number; dayOfWeek?: string; plannedFraction: number },
): string | null => {
  const half = day.plannedFraction === 0.5;
  switch (mode) {
    case "full":
      return `${day.dayOfWeek || day.day}${half ? " ½" : ""}`;
    case "short":
      return day.dayOfWeek || String(day.day);
    case "number":
      return String(day.day);
    case "sparse":
      return day.day % 2 === 1 ? String(day.day) : null;
  }
};
