"use client";

import { Box } from "@mantine/core";
import { LANE_INSET } from "~/app/components/sprint/chart/chartLayout";
import { useDeliveryChartContext } from "~/app/components/sprint/chart/DeliveryChartContext";
import { DeliveryChartCurrentDayLine } from "~/app/components/sprint/chart/DeliveryChartCurrentDayLine";
import { DeliveryChartDeadline } from "~/app/components/sprint/chart/DeliveryChartDeadline";
import { DeliveryChartEndDayLine } from "~/app/components/sprint/chart/DeliveryChartEndDayLine";
import { DeliveryChartStartDayLine } from "~/app/components/sprint/chart/DeliveryChartStartDayLine";

/**
 * Vertical lines over the header and every lane. This box has exactly the
 * same left/right inset as the bars, so a line at N% sits on the same x as
 * the N% point of every bar, whatever the width, zoom or sprint length.
 */
export const DeliveryChartLines = () => {
  const { sprintDeadlines } = useDeliveryChartContext();

  return (
    <Box
      pos="absolute"
      top={0}
      bottom={8}
      left={LANE_INSET}
      right={LANE_INSET}
      style={{ pointerEvents: "none", zIndex: 10 }}
      data-chart-lines=""
    >
      <DeliveryChartStartDayLine />
      {sprintDeadlines.map((deadline) => (
        <DeliveryChartDeadline
          key={`${deadline.day}-${deadline.name}`}
          name={deadline.name}
          description={deadline.description}
          colour={deadline.colour}
          day={deadline.day}
          isDeadline
        />
      ))}
      <DeliveryChartEndDayLine />
      <DeliveryChartCurrentDayLine />
    </Box>
  );
};
