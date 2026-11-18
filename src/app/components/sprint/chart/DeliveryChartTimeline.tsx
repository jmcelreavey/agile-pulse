"use client";

import { Box, Progress } from "@mantine/core";
import { LANE_INSET } from "~/app/components/sprint/chart/chartLayout";
import { useDeliveryChartContext } from "~/app/components/sprint/chart/DeliveryChartContext";
import { DeliveryChartTimelineHeader } from "~/app/components/sprint/chart/DeliveryChartTimelineHeader";

/** The row of day columns. Lines are drawn by DeliveryChartLines. */
export const DeliveryChartTimeline = () => {
  const { timelineDays } = useDeliveryChartContext();

  return (
    <Box px={LANE_INSET}>
      <Progress.Root size={50} w="100%" data-chart-timeline="">
        {timelineDays.map((day) => (
          <DeliveryChartTimelineHeader key={day.day} record={day} />
        ))}
      </Progress.Root>
    </Box>
  );
};
