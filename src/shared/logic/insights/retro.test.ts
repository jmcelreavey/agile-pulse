import { describe, expect, it } from "vitest";
import { chart, S } from "~/shared/logic/insights/fixtures";
import { generateRetro } from "~/shared/logic/insights/retro";

describe("generateRetro", () => {
  const history = [
    chart(0, 10, [["Ann", [["Auth", 2, S.NOT_STARTED], ["Docs", 1, S.NOT_STARTED]]], ["Ben", [["Search", 3, S.NOT_STARTED]]]]),
    chart(1, 10, [["Ann", [["Auth", 2, S.WITH_QA], ["Docs", 1, S.COMPLETED]]], ["Ben", [["Search", 3, S.BLOCKED]]]]),
    chart(2, 10, [["Ann", [["Auth", 4, S.IN_PROGRESS], ["Docs", 1, S.COMPLETED]]], ["Ben", [["Search", 3, S.BLOCKED]]]]),
    chart(3, 10, [["Ann", [["Auth", 6, S.WITH_QA], ["Docs", 1, S.COMPLETED]]], ["Ben", [["Search", 3, S.IN_PROGRESS], ["Promo", 2, S.NOT_STARTED]]]]),
  ];
  const current = chart(4, 10, [["Ann", [["Auth", 6, S.IN_PROGRESS], ["Docs", 1, S.COMPLETED]]], ["Ben", [["Search", 3, S.COMPLETED], ["Promo", 2, S.NOT_STARTED]]]]);

  it("leads with the biggest problem and quotes the evidence", () => {
    const retro = generateRetro(history, current);
    const first = retro.toDiscuss[0];
    expect(first?.taskKey).toBe("Auth");
    expect(first?.category).toBe("qa");
    expect(first?.evidence).toBe('"Auth" slipped 4 days, grew from 2 days to 6 days and came back from QA 2 times.');
    expect(first?.question).toMatch(/\?$/);
  });

  it("calls out blockers and scope added mid-sprint", () => {
    const retro = generateRetro(history, current);
    expect(retro.toDiscuss.some((p) => p.category === "blocker" && p.evidence.includes("blocked for 2 days"))).toBe(true);
    expect(retro.toDiscuss.some((p) => p.category === "scope" && p.evidence.includes('"Promo"'))).toBe(true);
    expect(retro.stats.scopeAddedDays).toBe(6);
  });

  it("finds what went well", () => {
    const retro = generateRetro(history, current);
    expect(retro.wentWell.map((p) => p.taskKey)).toContain("Docs");
    expect(retro.stats.completed).toBe(2);
  });
});
