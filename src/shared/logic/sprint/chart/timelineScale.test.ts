import { describe, expect, it } from "vitest";
import {
  columnCountForDays,
  createTimelineScale,
  currentDayLineDays,
  currentDayNumber,
  elapsedSprintDays,
  percentForDayStart,
  percentForElapsedDays,
  percentPerDay,
  plannedFractionOfDay,
} from "~/shared/logic/sprint/chart/timelineScale";

const columns = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** Full (unzoomed) chart for a sprint/lane of `days` days. */
const fullScale = (days: number) =>
  createTimelineScale(columns(1, columnCountForDays(days)));

/** Pixel x of a percentage on a bar of `width` px. */
const px = (percent: number | null, width: number) =>
  percent === null ? null : (percent / 100) * width;

describe("columnCountForDays", () => {
  it.each([
    [1, 1],
    [10, 10],
    [13.5, 14],
    [20, 20],
    [0.5, 1],
    [0, 1],
  ])("%s days -> %s columns", (days, expected) => {
    expect(columnCountForDays(days)).toBe(expected);
  });

  it("isn't thrown off by float noise", () => {
    expect(columnCountForDays(0.1 + 0.2 + 9.7)).toBe(10);
  });
});

describe("percentForElapsedDays on full sprints", () => {
  it.each([
    // [sprint days, elapsed, expected percent]
    [10, 0, 0],
    [10, 5, 50],
    [10, 10, 100],
    [1, 0, 0],
    [1, 0.5, 50],
    [1, 1, 100],
    [20, 0, 0],
    [20, 7, 35],
    [20, 20, 100],
    // 13.5 days is drawn as 14 whole columns; day 14 is the half day.
    [13.5, 0, 0],
    [13.5, 6.5, (6.5 / 14) * 100],
    [13.5, 13, (13 / 14) * 100],
    [13.5, 13.5, (13.5 / 14) * 100],
  ])("%s-day sprint, %s elapsed -> %s%%", (days, elapsed, expected) => {
    expect(percentForElapsedDays(fullScale(days), elapsed)).toBeCloseTo(
      expected,
      9,
    );
  });

  it("puts a whole-day line exactly on that day column's left edge", () => {
    for (const days of [1, 10, 13.5, 20]) {
      const scale = fullScale(days);
      for (let day = 1; day <= scale.columnCount; day++) {
        // Column `day` starts after `day - 1` whole columns.
        expect(percentForDayStart(scale, day)).toBeCloseTo(
          (day - 1) * percentPerDay(scale),
          9,
        );
      }
    }
  });

  it("lands on the column edge in pixels at every chart width", () => {
    const scale = fullScale(13.5);
    for (const width of [287, 640, 1189, 1777]) {
      for (let day = 1; day <= 14; day++) {
        const lineX = px(percentForDayStart(scale, day), width);
        const columnLeft = (day - 1) * (width / 14);
        expect(Math.abs((lineX ?? NaN) - columnLeft)).toBeLessThan(1e-6);
      }
    }
  });

  it("hides points outside the drawn columns", () => {
    expect(percentForElapsedDays(fullScale(10), -0.5)).toBeNull();
    expect(percentForElapsedDays(fullScale(10), 10.5)).toBeNull();
    expect(percentForElapsedDays(createTimelineScale([]), 0)).toBeNull();
  });
});

describe("overruns", () => {
  it("keeps today on the chart once the timeline grows to include it", () => {
    // 10-day sprint, 12.5 days in: the server draws 13 columns.
    const sprint = { days: 10, daysRemaining: -2.5 };
    const elapsed = elapsedSprintDays(sprint);
    expect(elapsed).toBe(12.5);
    const scale = fullScale(Math.max(sprint.days, elapsed));
    expect(scale.columnCount).toBe(13);
    expect(percentForElapsedDays(scale, elapsed)).toBeCloseTo(
      (12.5 / 13) * 100,
      9,
    );
  });

  it("uses the longest lane when tasks run past the sprint", () => {
    const scale = fullScale(Math.max(13.5, 16));
    expect(scale.columnCount).toBe(16);
    expect(percentForElapsedDays(scale, 13.5)).toBeCloseTo(
      (13.5 / 16) * 100,
      9,
    );
  });
});

describe("zoomed views", () => {
  it("middle-day zoom shows days 6-8 (elapsed 5..8)", () => {
    const scale = createTimelineScale([6, 7, 8]);
    expect(percentForDayStart(scale, 6)).toBe(0);
    expect(percentForDayStart(scale, 7)).toBeCloseTo(100 / 3, 9);
    expect(percentForElapsedDays(scale, 6.5)).toBeCloseTo(50, 9);
    expect(percentForElapsedDays(scale, 8)).toBe(100);
    expect(percentForElapsedDays(scale, 4)).toBeNull();
  });

  it("first-day zoom shows days 1-2 from the sprint start", () => {
    const scale = createTimelineScale([1, 2]);
    expect(percentForElapsedDays(scale, 0)).toBe(0);
    expect(percentForElapsedDays(scale, 1)).toBe(50);
    expect(percentForElapsedDays(scale, 0.5)).toBe(25);
  });

  it("last-day zoom of a 13.5-day sprint shows days 13-14", () => {
    const scale = createTimelineScale([13, 14]);
    expect(percentForElapsedDays(scale, 12)).toBe(0);
    expect(percentForElapsedDays(scale, 13)).toBe(50);
    expect(percentForElapsedDays(scale, 13.5)).toBe(75);
    expect(percentForElapsedDays(scale, 14)).toBe(100);
  });
});

describe("plannedFractionOfDay", () => {
  it.each([
    [13.5, 13, 1],
    [13.5, 14, 0.5],
    [13.5, 15, 0],
    [10, 10, 1],
    [10, 11, 0],
    [1, 1, 1],
    [0.5, 1, 0.5],
  ])("%s-day sprint, day %s -> %s", (days, day, expected) => {
    expect(plannedFractionOfDay(days, day)).toBe(expected);
  });
});

describe("elapsedSprintDays", () => {
  it.each([
    [10, 10, 0],
    [10, 5, 5],
    [13.5, 7, 6.5],
    [13.5, 0, 13.5],
    [20, -3, 23],
  ])("%s days with %s left -> %s elapsed", (days, daysRemaining, expected) => {
    expect(elapsedSprintDays({ days, daysRemaining })).toBe(expected);
  });
});

describe("current day line", () => {
  it.each([
    // [elapsed, current day, line at (days elapsed)]
    [0, 1, 0],
    [0.5, 1, 0],
    [6, 7, 6],
    [6.5, 7, 6],
    [6.999, 7, 6],
    [13, 14, 13],
    [13.5, 14, 13],
    [12.5, 13, 12],
    [-1, 1, 0],
  ])("%s days elapsed is day %s, line at %s", (elapsed, day, line) => {
    expect(currentDayNumber(elapsed)).toBe(day);
    expect(currentDayLineDays(elapsed)).toBe(line);
  });

  it("isn't pushed back a day by float noise", () => {
    expect(currentDayNumber(0.1 + 0.2 + 5.7)).toBe(7);
  });

  it.each([
    // [sprint days, days remaining, expected day column the line starts]
    [13.5, 7, 7],
    [13.5, 6.5, 8],
    [13.5, 0, 14],
    [10, 10, 1],
    [10, 4, 7],
    [10, 0, 11],
    [10, -2.5, 13],
    [1, 0.5, 1],
    [20, 13, 8],
  ])(
    "%s-day sprint with %s left: line on day %s's left edge",
    (days, daysRemaining, column) => {
      const elapsed = elapsedSprintDays({ days, daysRemaining });
      const scale = fullScale(Math.max(days, elapsed));
      expect(
        percentForElapsedDays(scale, currentDayLineDays(elapsed)),
      ).toBeCloseTo(percentForDayStart(scale, column) ?? NaN, 9);
    },
  );
});
