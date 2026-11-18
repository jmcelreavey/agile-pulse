import { describe, expect, it } from "vitest";
import { CalculateChartLinePositionUtil } from "~/shared/logic/sprint/chart/CalculateChartLinePositionUtil";

describe("CalculateChartLinePositionUtil", () => {
  it("should calculate the correct position for given parameters", () => {
    // (500 / 14) * 5 + 47 = 35.714 * 5 + 47 = 178.57 + 47 = 225.57
    expect(CalculateChartLinePositionUtil(500, 14, 5)).toBeCloseTo(225.57, 2);
  });

  it("should return the starting position when currentDay is 0", () => {
    // (500 / 14) * 0 + 47 = 0 + 47 = 47
    expect(CalculateChartLinePositionUtil(500, 14, 0)).toBe(47);
  });

  it("should return the maximum position when currentDay equals sprintLength", () => {
    // (500 / 14) * 14 + 47 = 500 + 47 = 547
    expect(CalculateChartLinePositionUtil(500, 14, 14)).toBe(547);
  });

  it("should handle edge case with zero width", () => {
    expect(CalculateChartLinePositionUtil(0, 14, 5)).toBe(0);
  });

  it("should handle edge case with zero sprint length", () => {
    expect(CalculateChartLinePositionUtil(500, 0, 5)).toBe(0);
  });
});
