"use client";

import {
  Box,
  getThemeColor,
  Pill,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { useLayoutEffect, useRef, useState } from "react";
import { LANE_INSET } from "~/app/components/sprint/chart/chartLayout";
import { useDeliveryChartContext } from "~/app/components/sprint/chart/DeliveryChartContext";
import {
  type ChartMarker,
  useChartMarkers,
} from "~/app/components/sprint/chart/useChartMarkers";
import ManageSprintDeadlineModal from "~/app/components/sprint/ManageSprintDeadlineModal";
import { layoutMarkerLabels } from "~/shared/logic/sprint/chart/markerLabelLayout";

const ROW_HEIGHT = 20;

/**
 * The vertical lines over the chart and their labels. Labels sit in a strip
 * above the day header, stacked into rows so they never overlap. The line
 * layer has exactly the same left/right inset as the header and the lanes,
 * so a line at N% is at the N% point of every bar.
 */
export const DeliveryChartLines = () => {
  const markers = useChartMarkers();
  const { ref, width } = useElementSize();
  const pillRefs = useRef(new Map<string, HTMLDivElement>());
  const [pillWidths, setPillWidths] = useState<Record<string, number>>({});

  const labelKey = markers.map((m) => `${m.key}:${m.label}`).join("|");

  // Measure the real label widths when labels change; re-layout if needed.
  useLayoutEffect(() => {
    const next: Record<string, number> = {};
    for (const [key, el] of pillRefs.current) next[key] = el.offsetWidth;
    const changed = Object.keys(next).some((k) => next[k] !== pillWidths[k]);
    if (changed) setPillWidths(next);
  }, [labelKey, pillWidths]);

  const { placements, rows } = layoutMarkerLabels(
    markers.map((m) => ({
      x: (m.percent / 100) * width,
      width: pillWidths[m.key] ?? m.label.length * 6 + 16,
    })),
    { width, overhang: LANE_INSET },
  );
  const stripHeight = rows * ROW_HEIGHT;

  return (
    <>
      <Box
        ref={ref}
        mx={LANE_INSET}
        h={stripHeight}
        mb={4}
        pos="relative"
        data-chart-labels=""
      >
        {markers.map((marker, i) => (
          <MarkerLabel
            key={marker.key}
            marker={marker}
            left={placements[i]?.left ?? 0}
            top={stripHeight - ((placements[i]?.row ?? 0) + 1) * ROW_HEIGHT}
            pillRef={(el) => {
              if (el) pillRefs.current.set(marker.key, el);
              else pillRefs.current.delete(marker.key);
            }}
          />
        ))}
      </Box>
      <Box
        pos="absolute"
        top={0}
        bottom={8}
        left={LANE_INSET}
        right={LANE_INSET}
        style={{ pointerEvents: "none", zIndex: 9 }}
        data-chart-lines=""
      >
        {markers.map((marker, i) => (
          <MarkerLine
            key={marker.key}
            marker={marker}
            // Start each line at its own label's row.
            top={
              stripHeight -
              ((placements[i]?.row ?? 0) + 1) * ROW_HEIGHT +
              ROW_HEIGHT / 2
            }
          />
        ))}
      </Box>
    </>
  );
};

const MarkerLine = ({ marker, top }: { marker: ChartMarker; top: number }) => {
  const theme = useMantineTheme();
  return (
    <Box
      pos="absolute"
      top={top}
      bottom={0}
      left={`${marker.percent}%`}
      w={0}
      ml={-1}
      style={{
        borderLeft: `2px dashed ${getThemeColor(marker.colour, theme)}`,
      }}
      data-chart-line={marker.name}
      data-day={marker.lineDays}
      data-elapsed={marker.elapsedDays}
      aria-hidden
    />
  );
};

const MarkerLabel = ({
  marker,
  left,
  top,
  pillRef,
}: {
  marker: ChartMarker;
  left: number;
  top: number;
  pillRef: (el: HTMLDivElement | null) => void;
}) => {
  const { sprintDeadlines, isDisabled } = useDeliveryChartContext();
  const [opened, setOpened] = useState(false);
  const clickable = marker.deadlineDay !== undefined && !isDisabled;

  return (
    <>
      <Tooltip label={marker.tooltip}>
        <Box
          ref={pillRef}
          pos="absolute"
          left={left}
          top={top}
          style={{
            zIndex: 11,
            whiteSpace: "nowrap",
            cursor: clickable ? "pointer" : undefined,
          }}
          onClick={clickable ? () => setOpened(true) : undefined}
          data-chart-label={marker.name}
        >
          <Pill size="xs">{marker.label}</Pill>
        </Box>
      </Tooltip>
      {marker.deadlineDay !== undefined && (
        <ManageSprintDeadlineModal
          opened={opened}
          onClose={() => setOpened(false)}
          deadline={sprintDeadlines.find((d) => d.day === marker.deadlineDay)}
          day={marker.deadlineDay}
        />
      )}
    </>
  );
};
