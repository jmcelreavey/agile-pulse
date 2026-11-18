import { describe, expect, it } from "vitest";
import { computeForecast } from "~/shared/logic/insights/forecast";
import { chart, S } from "~/shared/logic/insights/fixtures";

describe("computeForecast", () => {
  it("uses the plan before the sprint starts", () => {
    const forecast = computeForecast(chart(0, 10, [["Ann", [["a", 4, S.NOT_STARTED], ["b", 4, S.NOT_STARTED]]]]));
    expect(forecast.status).toBe("not-started");
    expect(forecast.forecastEnd).toBe(8);
    expect(forecast.atRisk).toHaveLength(0);
  });

  it("flags a plan that already overruns the sprint", () => {
    const forecast = computeForecast(chart(0, 10, [["Ann", [["a", 6, S.NOT_STARTED], ["b", 6, S.NOT_STARTED]]]]));
    expect(forecast.status).toBe("late");
    expect(forecast.atRisk.map((task) => task.key)).toEqual(["b"]);
    expect(forecast.atRisk[0]?.reasons[0]?.code).toBe("past-end");
  });

  it("is on track when work is done on plan", () => {
    const forecast = computeForecast(
      chart(4, 10, [["Ann", [["a", 4, S.COMPLETED], ["b", 4, S.NOT_STARTED]]]])
    );
    expect(forecast.pace).toBe(1);
    expect(forecast.forecastEnd).toBe(8);
    expect(forecast.status).toBe("on-track");
  });

  it("projects a late landing when the team is behind and names the at-risk tasks", () => {
    const forecast = computeForecast(
      chart(5, 10, [
        ["Ann", [["a", 4, S.IN_PROGRESS], ["b", 4, S.NOT_STARTED]]],
        ["Ben", [["c", 5, S.COMPLETED], ["d", 3, S.NOT_STARTED]]],
      ])
    );
    // Ann earned 1.6 of 4 planned days: pace 0.4, so 6.4 days of work left takes 16 days.
    expect(forecast.lanes[0]?.pace).toBe(0.4);
    expect(forecast.status).toBe("late");
    expect(forecast.forecastEnd).toBeGreaterThan(10);
    const a = forecast.atRisk.find((task) => task.key === "a");
    expect(a?.severity).toBe("high");
    expect(a?.reasons.map((reason) => reason.code)).toContain("behind-plan");
    expect(forecast.atRisk.find((task) => task.key === "d")).toBeUndefined();
    expect(forecast.summary).toMatch(/late/);
  });

  it("adds leave still to come to the lane's landing day", () => {
    const forecast = computeForecast(
      chart(2, 10, [["Ann", [["a", 2, S.COMPLETED], ["b", 4, S.NOT_STARTED], ["leave", 3, S.LEAVE]]]])
    );
    expect(forecast.lanes[0]?.forecastEnd).toBe(9);
  });

  it("uses the snapshots to catch slips, QA bounces and blockers early", () => {
    const history = [
      chart(0, 10, [["Ann", [["a", 2, S.NOT_STARTED], ["b", 3, S.NOT_STARTED]]]]),
      chart(1, 10, [["Ann", [["a", 2, S.IN_PROGRESS], ["b", 3, S.NOT_STARTED]]]]),
      chart(2, 10, [["Ann", [["a", 2, S.WITH_QA], ["b", 3, S.NOT_STARTED]]]]),
      chart(3, 10, [["Ann", [["a", 4, S.IN_PROGRESS], ["b", 3, S.BLOCKED]]]]),
    ];
    const current = chart(4, 10, [["Ann", [["a", 4, S.IN_PROGRESS], ["b", 3, S.BLOCKED]]]]);
    const forecast = computeForecast(current, { history });
    const a = forecast.atRisk.find((task) => task.key === "a");
    const codes = a?.reasons.map((reason) => reason.code);
    expect(codes).toContain("estimate-grew");
    expect(codes).toContain("qa-bounce");
    expect(forecast.atRisk.find((task) => task.key === "b")?.reasons.map((r) => r.code)).toContain("blocked");
  });

  it("marks tasks whose pull request has gone quiet", () => {
    const now = new Date("2026-11-18T12:00:00Z");
    const forecast = computeForecast(chart(1, 10, [["Ann", [["a", 3, S.IN_PROGRESS]]]]), {
      now,
      links: [
        {
          taskKey: "a",
          provider: "github",
          kind: "pull_request",
          externalId: "acme/shop#12",
          url: "https://github.com/acme/shop/pull/12",
          status: "open",
          lastEventAt: new Date("2026-11-13T12:00:00Z"),
        },
      ],
    });
    expect(forecast.atRisk[0]?.reasons.map((r) => r.code)).toContain("stale-pr");
  });

  it("reports done when every task is complete", () => {
    expect(computeForecast(chart(6, 10, [["Ann", [["a", 3, S.COMPLETED]]]])).status).toBe("done");
  });
});
