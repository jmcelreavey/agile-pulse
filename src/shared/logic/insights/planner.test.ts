import { describe, expect, it } from "vitest";
import { focusFactorFromHistory, parseBacklog, planSprint } from "~/shared/logic/insights/planner";

describe("parseBacklog", () => {
  it("reads estimates, sizes and assignees in common formats", () => {
    const items = parseBacklog(`
      - Login page (2d) @ann
      * Password reset | 1.5
      1. Search results 3 days
      [ ] Audit log (L)
      Billing export, 2
      Fix footer
      # a comment
    `);
    expect(items).toEqual([
      { name: "Login page", days: 2, assignee: "ann" },
      { name: "Password reset", days: 1.5, assignee: null },
      { name: "Search results", days: 3, assignee: null },
      { name: "Audit log", days: 3, assignee: null },
      { name: "Billing export", days: 2, assignee: null },
      { name: "Fix footer", days: null, assignee: null },
    ]);
  });

  it("keeps Jira keys in the name", () => {
    expect(parseBacklog("PAY-120 Refund emails 1d")[0]).toEqual({ name: "PAY-120 Refund emails", days: 1, assignee: null });
  });
});

describe("planSprint", () => {
  const members = [
    { name: "Ann", allocatedDays: 0, timeOffDays: 0, focusFactor: 1 },
    { name: "Ben", allocatedDays: 2, timeOffDays: 3, focusFactor: 1 },
    { name: "Cat", allocatedDays: 0, timeOffDays: 0, focusFactor: 0.8 },
  ];

  it("places the biggest items first on the lane with the most free capacity", () => {
    const plan = planSprint(parseBacklog("Alpha 5\nBravo 4\nCharlie 3\nDelta 2"), members, 10);
    const byName = Object.fromEntries(plan.tasks.map((task) => [task.name, task.member]));
    expect(byName).toEqual({ Alpha: "Ann", Bravo: "Cat", Charlie: "Ann", Delta: "Ben" });
    expect(plan.lanes.find((lane) => lane.member === "Cat")?.capacity).toBe(8);
    expect(plan.overflow).toHaveLength(0);
  });

  it("respects leave and returns what doesn't fit as overflow", () => {
    const plan = planSprint(parseBacklog("Big 9\nHuge 12"), members, 10);
    expect(plan.tasks.map((task) => task.name)).toEqual(["Big"]);
    expect(plan.overflow.map((task) => task.name)).toEqual(["Huge"]);
    expect(plan.summary).toMatch(/left over/);
  });

  it("honours @name even when it overloads someone, and says so", () => {
    const plan = planSprint(parseBacklog("Thing 6 @ben"), members, 10);
    expect(plan.tasks[0]?.member).toBe("Ben");
    expect(plan.tasks[0]?.reason).toMatch(/only had 5 days free/);
  });

  it("sizes unestimated items at the median estimate", () => {
    const plan = planSprint(parseBacklog("Alpha 1\nBravo 3\nCharlie 2\nDelta"), members, 10);
    expect(plan.defaultEstimate).toBe(2);
    expect(plan.tasks.find((task) => task.name === "Delta")).toMatchObject({ days: 2, estimated: true });
  });
});

describe("focusFactorFromHistory", () => {
  it("is completed over planned, clamped", () => {
    expect(focusFactorFromHistory([{ planned: 10, completed: 8 }, { planned: 10, completed: 7 }])).toBe(0.75);
    expect(focusFactorFromHistory([{ planned: 10, completed: 1 }])).toBe(0.5);
    expect(focusFactorFromHistory([])).toBe(1);
  });
});
