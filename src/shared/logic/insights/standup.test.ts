import { describe, expect, it } from "vitest";
import { computeForecast } from "~/shared/logic/insights/forecast";
import { chart, S } from "~/shared/logic/insights/fixtures";
import { buildStandup, standupToHtml, standupToText } from "~/shared/logic/insights/standup";

describe("buildStandup", () => {
  const yesterday = chart(3, 10, [
    ["Ann", [["a", 3, S.WITH_QA], ["b", 3, S.NOT_STARTED]]],
    ["Ben", [["leave", 5, S.LEAVE], ["c", 2, S.NOT_STARTED]]],
  ]);
  const today = chart(4, 10, [
    ["Ann", [["a", 3, S.COMPLETED], ["b", 3, S.IN_PROGRESS], ["new", 1, S.NOT_STARTED]]],
    ["Ben", [["leave", 5, S.LEAVE], ["c", 2, S.BLOCKED]]],
  ]);

  it("lists yesterday's moves, today's lanes and blockers", () => {
    const standup = buildStandup(yesterday, today, computeForecast(today));
    expect(standup.completed).toEqual([{ task: "a", member: "Ann", from: S.WITH_QA, to: S.COMPLETED }]);
    expect(standup.moves.map((m) => m.task)).toEqual(["b", "c"]);
    expect(standup.added).toEqual([{ task: "new", member: "Ann", days: 1 }]);
    expect(standup.today).toEqual([
      { member: "Ann", focus: "b", state: S.IN_PROGRESS, next: "new", away: false },
      { member: "Ben", focus: "c", state: S.BLOCKED, next: null, away: true },
    ]);
    expect(standup.blockers[0]).toEqual({ task: "c", member: "Ben", reason: "Blocked" });
  });

  it("renders text and escaped HTML", () => {
    const standup = buildStandup(yesterday, today);
    const text = standupToText(standup, "Shop <Sprint 3>");
    expect(text).toContain("• Done: a (Ann)");
    expect(text).toContain("• Ben: away");
    expect(standupToHtml(standup, "Shop <Sprint 3>")).toContain("Shop &lt;Sprint 3&gt;");
  });
});
