import { describe, expect, it } from "vitest";
import { computeForecast } from "~/shared/logic/insights/forecast";
import { chart, S } from "~/shared/logic/insights/fixtures";
import { buildICalendar } from "~/shared/logic/insights/ical";
import { findJiraKeys, parseLinkUrl } from "~/shared/logic/insights/links";
import { draftWeeklyUpdate, etaFromForecast } from "~/shared/logic/insights/weeklyUpdate";
import { addWorkingDays } from "~/shared/logic/insights/workingDays";

describe("working days", () => {
  it("skips weekends", () => {
    // Friday 20 Nov 2026 + 1 working day = Monday 23 Nov
    expect(addWorkingDays(new Date("2026-11-20T00:00:00Z"), 1).toISOString().slice(0, 10)).toBe("2026-11-23");
    expect(addWorkingDays(new Date("2026-11-18T00:00:00Z"), 2.5).toISOString().slice(0, 10)).toBe("2026-11-23");
  });
});

describe("links", () => {
  it("parses GitHub and Jira URLs", () => {
    expect(parseLinkUrl("https://github.com/acme/shop/pull/42/files")).toEqual({
      provider: "github",
      kind: "pull_request",
      externalId: "acme/shop#42",
      url: "https://github.com/acme/shop/pull/42",
    });
    expect(parseLinkUrl("https://acme.atlassian.net/browse/PAY-7?focus=1")).toMatchObject({ provider: "jira", externalId: "PAY-7" });
    expect(parseLinkUrl("https://example.com")).toBeNull();
  });

  it("finds Jira keys in titles and branches", () => {
    expect(findJiraKeys("PAY-12: refunds", "feature/pay-13-webhooks", null)).toEqual(["PAY-12", "PAY-13"]);
  });
});

describe("weekly update", () => {
  const forecast = computeForecast(chart(5, 10, [["Ann", [["a", 5, S.COMPLETED], ["b", 5, S.IN_PROGRESS]]]]));

  it("turns the forecast into a working-day ETA", () => {
    const eta = etaFromForecast(forecast, new Date("2026-11-18T09:00:00Z"));
    expect(eta.date.toISOString().slice(0, 10)).toBe("2026-11-23");
    expect(eta.text).toMatch(/finished by Mon 23 Nov/);
  });

  it("drafts plain English without names or states", () => {
    const update = draftWeeklyUpdate({
      projectName: "Shop",
      sprintReference: "7",
      completed: ["Faster checkout"],
      inProgress: ["Refunds"],
      upNext: [],
      forecast,
      today: new Date("2026-11-18T09:00:00Z"),
    });
    expect(update.markdown).toContain("- Faster checkout");
    expect(update.markdown).not.toMatch(/Ann|In Progress/);
  });
});

describe("buildICalendar", () => {
  it("writes all-day events with escaping and CRLF line endings", () => {
    const ics = buildICalendar("Shop", [
      { uid: "d1@agile-pulse", title: "Release, v2; final", date: new Date("2026-11-20T00:00:00Z"), description: "Line one\nLine two" },
    ], new Date("2026-11-18T00:00:00Z"));
    expect(ics).toContain("DTSTART;VALUE=DATE:20261120\r\nDTEND;VALUE=DATE:20261121");
    expect(ics).toContain("SUMMARY:Release\\, v2\\; final");
    expect(ics).toContain("DESCRIPTION:Line one\\nLine two");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});
