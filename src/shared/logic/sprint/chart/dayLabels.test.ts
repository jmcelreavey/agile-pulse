import { describe, expect, it } from "vitest";
import {
  dayLabelMode,
  dayLabelText,
} from "~/shared/logic/sprint/chart/dayLabels";

describe("dayLabelMode", () => {
  it.each([
    [80, "full"],
    [56, "full"],
    [40, "short"],
    [20, "number"], // a 14-day sprint on a 375px phone
    [12, "sparse"],
  ])("%spx columns -> %s", (width, mode) => {
    expect(dayLabelMode(width)).toBe(mode);
  });
});

describe("dayLabelText", () => {
  const wed = { day: 7, dayOfWeek: "WED", plannedFraction: 1 };
  const halfFri = { day: 14, dayOfWeek: "FRI", plannedFraction: 0.5 };
  it("writes as much as fits", () => {
    expect(dayLabelText("full", wed)).toBe("WED");
    expect(dayLabelText("full", halfFri)).toBe("FRI ½");
    expect(dayLabelText("short", halfFri)).toBe("FRI");
    expect(dayLabelText("number", wed)).toBe("7");
    expect(dayLabelText("sparse", wed)).toBe("7");
    expect(dayLabelText("sparse", halfFri)).toBeNull();
  });
  it("falls back to the day number before the sprint starts", () => {
    expect(dayLabelText("full", { day: 3, plannedFraction: 1 })).toBe("3");
    expect(dayLabelText("short", { day: 3, plannedFraction: 1 })).toBe("3");
  });
});
