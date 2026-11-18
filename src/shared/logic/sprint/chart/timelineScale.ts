/**
 * One scale for everything drawn across the sprint chart.
 *
 * The chart is a row of equal-width day columns. Column `n` covers the
 * working time from `n - 1` to `n` days elapsed, so the left edge of column
 * `n` is the moment day `n` starts. Day columns, task blocks and every
 * vertical line (current day, deadlines, start/end) are placed with these
 * functions, in percent of the same box, so they can't drift apart at any
 * width, zoom or sprint length. Fractional days (13.5-day sprints, half-day
 * progress) are just fractions along the same axis.
 */
export type TimelineScale = {
  /** Day number of the first visible column (1 unless zoomed). */
  firstDay: number;
  /** Number of visible columns. */
  columnCount: number;
};

/** Build the scale from the day columns actually rendered. */
export const createTimelineScale = (
  columnDayNumbers: number[],
): TimelineScale => {
  if (columnDayNumbers.length === 0) {
    return { firstDay: 1, columnCount: 0 };
  }
  return {
    firstDay: Math.min(...columnDayNumbers),
    columnCount: columnDayNumbers.length,
  };
};

/** Whole columns needed to show `days` of work (13.5 days -> 14 columns). */
export const columnCountForDays = (days: number): number =>
  Math.max(1, Math.ceil(Math.max(0, days) - 1e-9));

/**
 * Where a point in time sits, in percent of the timeline width.
 * `elapsedDays` is days since the sprint started (0 = start of day 1,
 * 6.5 = halfway through day 7). Returns null if it's outside the visible
 * columns (e.g. a zoomed view of another day).
 */
export const percentForElapsedDays = (
  scale: TimelineScale,
  elapsedDays: number,
): number | null => {
  if (scale.columnCount <= 0 || !Number.isFinite(elapsedDays)) {
    return null;
  }
  const offset = elapsedDays - (scale.firstDay - 1);
  const percent = (offset / scale.columnCount) * 100;
  const epsilon = 1e-9;
  if (percent < -epsilon || percent > 100 + epsilon) {
    return null;
  }
  return Math.min(100, Math.max(0, percent));
};

/** Left edge of day column `dayNumber`, in percent (the start of that day). */
export const percentForDayStart = (scale: TimelineScale, dayNumber: number) =>
  percentForElapsedDays(scale, dayNumber - 1);

/** Width of one day column, in percent. */
export const percentPerDay = (scale: TimelineScale) =>
  scale.columnCount > 0 ? 100 / scale.columnCount : 0;

/** Days elapsed in a sprint (the red "current day" line). */
export const elapsedSprintDays = (sprint: {
  days: number;
  daysRemaining: number;
}) => sprint.days - sprint.daysRemaining;

/**
 * How much of day column `dayNumber` is inside the planned sprint, 0..1.
 * A 13.5-day sprint gives 1 for days 1-13, 0.5 for day 14 and 0 after.
 */
export const plannedFractionOfDay = (sprintDays: number, dayNumber: number) =>
  Math.min(1, Math.max(0, sprintDays - (dayNumber - 1)));
