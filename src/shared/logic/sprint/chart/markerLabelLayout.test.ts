import { describe, expect, it } from "vitest";
import { layoutMarkerLabels } from "~/shared/logic/sprint/chart/markerLabelLayout";

const overlaps = (
  a: { left: number; row: number; width: number },
  b: { left: number; row: number; width: number },
) => a.row === b.row && a.left < b.left + b.width && b.left < a.left + a.width;

describe("layoutMarkerLabels", () => {
  it("keeps far-apart labels on one row, centred on their lines", () => {
    const { placements, rows } = layoutMarkerLabels(
      [
        { x: 100, width: 40 },
        { x: 300, width: 60 },
      ],
      { width: 600 },
    );
    expect(rows).toBe(1);
    expect(placements).toEqual([
      { left: 80, row: 0 },
      { left: 270, row: 0 },
    ]);
  });

  it("stacks labels that would overlap (phone width)", () => {
    const labels = [
      { x: 0, width: 70 }, // start date
      { x: 120, width: 50 }, // Day 7
      { x: 140, width: 75 }, // Code freeze
      { x: 180, width: 75 }, // Release 2.4
    ];
    const { placements, rows } = layoutMarkerLabels(labels, {
      width: 280,
      overhang: 17,
    });
    expect(rows).toBeGreaterThan(1);
    const boxes = placements.map((p, i) => ({ ...p, width: labels[i]!.width }));
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        expect(overlaps(boxes[i]!, boxes[j]!)).toBe(false);
      }
    }
  });

  it("nudges labels at the ends inside the chart (plus overhang)", () => {
    const { placements } = layoutMarkerLabels(
      [
        { x: 0, width: 60 },
        { x: 500, width: 60 },
      ],
      { width: 500, overhang: 10 },
    );
    expect(placements[0]!.left).toBe(-10);
    expect(placements[1]!.left).toBe(450);
  });

  it("returns placements in input order and at least one row", () => {
    expect(layoutMarkerLabels([], { width: 300 }).rows).toBe(1);
    const { placements } = layoutMarkerLabels(
      [
        { x: 200, width: 20 },
        { x: 10, width: 20 },
      ],
      { width: 300 },
    );
    expect(placements[0]!.left).toBe(190);
    expect(placements[1]!.left).toBe(0);
  });

  it("caps the number of rows", () => {
    const labels = Array.from({ length: 8 }, () => ({ x: 50, width: 60 }));
    expect(layoutMarkerLabels(labels, { width: 100, maxRows: 3 }).rows).toBe(3);
  });
});
