import {
  Box,
  getThemeColor,
  Pill,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import React from "react";
import { useDeliveryChartContext } from "~/app/components/sprint/chart/DeliveryChartContext";
import ManageSprintDeadlineModal from "~/app/components/sprint/ManageSprintDeadlineModal";
import { percentForElapsedDays } from "~/shared/logic/sprint/chart/timelineScale";

/**
 * A vertical line at `day` days elapsed (0 = start of day 1, 6.5 = halfway
 * through day 7). Must be rendered inside DeliveryChartLines, which shares
 * the bars' x-axis; the position is a percentage from the shared scale.
 */
export const DeliveryChartDeadline = ({
  name,
  description,
  colour,
  day,
  isDeadline = false,
}: {
  name: string;
  description?: string;
  colour: string;
  day: number;
  isDeadline?: boolean;
}) => {
  const { scale, sprintDeadlines, isDisabled } = useDeliveryChartContext();
  const [opened, { open, close }] = useDisclosure(false);
  const theme = useMantineTheme();

  const percent = percentForElapsedDays(scale, day);
  if (percent === null) {
    return null;
  }

  const left = `${percent}%`;
  const clickable = isDeadline && !isDisabled;

  return (
    <React.Fragment>
      <Tooltip label={`${name}${description ? ` - ${description}` : ""}`}>
        <Box
          pos="absolute"
          top={-22}
          left={left}
          style={{
            transform: "translateX(-50%)",
            pointerEvents: "auto",
            cursor: clickable ? "pointer" : undefined,
            whiteSpace: "nowrap",
          }}
          onClick={clickable ? open : undefined}
        >
          <Pill size="xs">{name}</Pill>
        </Box>
      </Tooltip>
      <Box
        pos="absolute"
        top={0}
        bottom={0}
        left={left}
        w={0}
        ml={-1}
        style={{ borderLeft: `2px dashed ${getThemeColor(colour, theme)}` }}
        data-chart-line={name}
        data-day={day}
        aria-hidden
      />
      {isDeadline && (
        <ManageSprintDeadlineModal
          opened={opened}
          onClose={close}
          deadline={sprintDeadlines.find((d) => d.day === day)}
          day={day}
        />
      )}
    </React.Fragment>
  );
};
