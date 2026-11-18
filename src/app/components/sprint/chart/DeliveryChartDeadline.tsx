import {
  Divider,
  Pill,
  Stack,
  Tooltip,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import React from "react";
import { useDeliveryChartContext } from "~/app/components/sprint/chart/DeliveryChartContext";
import ManageSprintDeadlineModal from "~/app/components/sprint/ManageSprintDeadlineModal";
import { CalculateChartLinePositionUtil } from "~/shared/logic/sprint/chart/CalculateChartLinePositionUtil";

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
  const {
    sprint,
    chartWidth,
    sprintDeadlines,
    isDisabled,
    actualSprintLength,
    sectionWidths,
  } = useDeliveryChartContext();
  const [opened, { open, close }] = useDisclosure(false);
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  // Check if the day is visible in the current zoom window
  if (sprint.zoom) {
    const { previousDay, currentDay, nextDay } = sprint.zoom;
    const visibleDays = [previousDay.number, currentDay.number];
    if (nextDay) {
      visibleDays.push(nextDay.number);
    }
    if (!visibleDays.includes(day)) {
      return null;
    }
  }

  const linePosition = CalculateChartLinePositionUtil(
    chartWidth,
    sprint.zoom
      ? sprint.zoom.isFirstDay || sprint.zoom.isLastDay
        ? 2
        : 3
      : actualSprintLength,
    sprint.zoom
      ? day -
          sprint.zoom.previousDay.number +
          (sprint.zoom.isFirstDay || sprint.zoom.isLastDay ? 0 : 1)
      : day,
    sectionWidths
  );

  const height = `calc(100% - 42px)`;

  if (linePosition <= 0) {
    return null;
  }

  return (
    <React.Fragment>
      <Stack
        align="center"
        onClick={isDeadline && !isDisabled ? open : undefined}
      >
        <Tooltip
          label={`${name}${description ? ` - ${description}` : ""}`}
          left={`${linePosition + 32}px`}
        >
          <div>
            <Pill
              size="xs"
              pos={"absolute"}
              left={`${linePosition - 32}px`}
              top={12}
              style={{
                zIndex: 10,
              }}
              bottom={0}
            >
              {name}
            </Pill>
            <Divider
              pos={"absolute"}
              style={{ height, zIndex: 10 }}
              left={`${linePosition}px`}
              bg={isDark ? "black" : "white"}
              bd={`1px dashed ${colour}`}
            />
          </div>
        </Tooltip>
      </Stack>
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
