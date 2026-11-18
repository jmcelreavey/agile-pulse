/**
 * Places the little name labels above the chart's vertical lines so they
 * don't sit on top of each other. Each label is centred on its line where
 * it fits, nudged inside the chart at the edges, and moved up a row when it
 * would overlap a label already placed. Pure, so it's unit tested.
 */
export type MarkerLabelInput = {
  /** Line position in px from the left of the bar. */
  x: number;
  /** Label width in px. */
  width: number;
};

export type MarkerLabelPlacement = {
  /** Label's left edge in px from the left of the bar. */
  left: number;
  /** 0 is the row nearest the chart. */
  row: number;
};

export const layoutMarkerLabels = (
  labels: MarkerLabelInput[],
  options: {
    /** Bar width in px. */
    width: number;
    /** How far labels may hang past each end of the bar, in px. */
    overhang?: number;
    gap?: number;
    maxRows?: number;
  },
): { placements: MarkerLabelPlacement[]; rows: number } => {
  const { width, overhang = 0, gap = 4, maxRows = 4 } = options;
  const placements: MarkerLabelPlacement[] = labels.map(() => ({
    left: 0,
    row: 0,
  }));
  // Right edge of the last label in each row.
  const rowEnds: number[] = [];

  const order = labels
    .map((label, index) => ({ ...label, index }))
    .sort((a, b) => a.x - b.x || a.index - b.index);

  for (const label of order) {
    const min = -overhang;
    const max = Math.max(min, width + overhang - label.width);
    const left = Math.min(max, Math.max(min, label.x - label.width / 2));

    let row = rowEnds.findIndex((end) => end + gap <= left);
    if (row === -1) {
      if (rowEnds.length < maxRows) {
        row = rowEnds.length;
      } else {
        // Out of rows: use the row that frees up first.
        row = rowEnds.indexOf(Math.min(...rowEnds));
      }
    }
    rowEnds[row] = Math.max(rowEnds[row] ?? -Infinity, left + label.width);
    placements[label.index] = { left, row };
  }

  return { placements, rows: Math.max(1, rowEnds.length) };
};
