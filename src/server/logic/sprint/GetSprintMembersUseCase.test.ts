import { describe, expect, it } from "vitest";
import { type PrismaClient } from "~/generated/prisma/client";
import { GetSprintMembersUseCase } from "~/server/logic/sprint/GetSprintMembersUseCase";
import {
  createTimelineScale,
  percentForElapsedDays,
} from "~/shared/logic/sprint/chart/timelineScale";

const lane = (id: number, taskDays: number[]) => ({
  id,
  order: id,
  sprint: { id: 1, projectId: 1, reference: "S1" },
  member: { name: `Member ${id}`, id },
  sprintTasks: taskDays.map((days, i) => ({
    id: id * 100 + i,
    days,
    order: i,
    ticketUrl: null,
    task: {
      id: id * 100 + i,
      name: `Task ${i}`,
      state: "IN_PROGRESS",
      updatedAt: new Date(),
      description: null,
      jiraIssueKey: null,
    },
  })),
});

const run = async (
  sprint: { days: number; daysRemaining: number },
  lanes: number[][],
  zoomDay?: number,
) => {
  const db = {
    sprintMember: {
      findMany: () => Promise.resolve(lanes.map((t, i) => lane(i + 1, t))),
    },
    sprint: {
      findUnique: () =>
        Promise.resolve({ startedAt: new Date("2026-11-02"), ...sprint }),
    },
  } as unknown as PrismaClient;
  return new GetSprintMembersUseCase(db).execute({ sprintId: 1, zoomDay });
};

const columnsOf = (result: Awaited<ReturnType<typeof run>>) =>
  result[0]!.timelineDays.map((d) => d.number);

describe("GetSprintMembersUseCase timeline", () => {
  it("draws a 13.5-day sprint as 14 equal columns with tasks on the same scale", async () => {
    const result = await run({ days: 13.5, daysRemaining: 7 }, [[3, 4.5, 6]]);
    expect(columnsOf(result)).toEqual(
      Array.from({ length: 14 }, (_, i) => i + 1),
    );
    for (const day of result[0]!.timelineDays) {
      expect(day.percentage).toBeCloseTo(100 / 14, 9);
    }
    // Each task's left edge (sum of the widths before it) is the same point
    // the shared scale gives for the day it starts on.
    const scale = createTimelineScale(columnsOf(result));
    let left = 0;
    for (const task of result[0]!.tasks) {
      expect(left).toBeCloseTo(
        percentForElapsedDays(scale, task.order - 1) ?? NaN,
        9,
      );
      left += task.percentage;
    }
    expect(left).toBeCloseTo((13.5 / 14) * 100, 9);
  });

  it.each([
    [10, 10, [[4, 6]], 10],
    [1, 1, [[1]], 1],
    [
      20,
      3,
      [
        [5, 5],
        [10, 2],
      ],
      20,
    ],
    [13.5, 13.5, [[2]], 14],
  ])(
    "%s-day sprint (%s left) has %s columns",
    async (days, daysRemaining, lanes, expected) => {
      const result = await run({ days, daysRemaining }, lanes);
      expect(columnsOf(result)).toHaveLength(expected);
    },
  );

  it("grows the timeline so an overrunning sprint still shows today", async () => {
    const result = await run({ days: 10, daysRemaining: -2.5 }, [[4, 4]]);
    expect(columnsOf(result)).toHaveLength(13);
  });

  it("zooms into whole-day windows that the line scale can read", async () => {
    const first = await run({ days: 13.5, daysRemaining: 13.5 }, [[13.5]], 1);
    expect(columnsOf(first)).toEqual([1, 2]);
    const middle = await run({ days: 13.5, daysRemaining: 7 }, [[13.5]], 7);
    expect(columnsOf(middle)).toEqual([6, 7, 8]);
    const last = await run({ days: 13.5, daysRemaining: 0 }, [[13.5]], 14);
    expect(columnsOf(last)).toEqual([13, 14]);
    // A task spanning the window fills it exactly.
    expect(middle[0]!.tasks[0]!.percentage).toBeCloseTo(100, 9);
  });
});
