"use client";

import { Box, Progress } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { LANE_INSET } from "~/app/components/sprint/chart/chartLayout";
import { useDeliveryChartContext } from "~/app/components/sprint/chart/DeliveryChartContext";
import { DeliveryChartTimelineHeader } from "~/app/components/sprint/chart/DeliveryChartTimelineHeader";
import { dayLabelMode } from "~/shared/logic/sprint/chart/dayLabels";

/** The row of day columns. Lines are drawn by DeliveryChartLines. */
export const DeliveryChartTimeline = () => {
  const { timelineDays } = useDeliveryChartContext();
  const { ref, width } = useElementSize();
  // Before the first measurement assume a desktop-width chart.
  const columnWidth =
    width > 0 && timelineDays.length > 0 ? width / timelineDays.length : 80;
  const mode = dayLabelMode(columnWidth);

  return (
    <Box px={LANE_INSET}>
      <Progress.Root
        ref={ref}
        size={50}
        w="100%"
        data-chart-timeline=""
        data-label-mode={mode}
      >
        {timelineDays.map((day) => (
          <DeliveryChartTimelineHeader key={day.day} record={day} mode={mode} />
        ))}
      </Progress.Root>
    </Box>
  );
};
