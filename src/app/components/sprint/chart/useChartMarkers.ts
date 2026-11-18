import { useMantineColorScheme } from "@mantine/core";
import { useDeliveryChartContext } from "~/app/components/sprint/chart/DeliveryChartContext";
import {
  currentDayLineDays,
  currentDayNumber,
  elapsedSprintDays,
  percentForElapsedDays,
} from "~/shared/logic/sprint/chart/timelineScale";
import { State } from "~/shared/types/State";

export type ChartMarker = {
  key: string;
  /** Shown on the pill above the line; also the line's data-chart-line. */
  name: string;
  label: string;
  tooltip: string;
  colour: string;
  /** Days elapsed the line is drawn at. */
  lineDays: number;
  /** Raw days elapsed it stands for (differs for the current day). */
  elapsedDays: number;
  percent: number;
  /** Set for user deadlines, which open the deadline editor. */
  deadlineDay?: number;
};

const formatDays = (days: number) => `${days} day${days === 1 ? "" : "s"}`;

/** Every vertical line on the chart, positioned on the shared scale. */
export const useChartMarkers = (): ChartMarker[] => {
  const { sprint, sprintDeadlines, scale } = useDeliveryChartContext();
  const { colorScheme } = useMantineColorScheme();
  const neutral = colorScheme === "dark" ? "gray.6" : "black";
  const elapsed = elapsedSprintDays(sprint);

  const candidates: Omit<ChartMarker, "percent">[] = [];

  if (sprint.startedAt) {
    candidates.push({
      key: "start",
      name: "Sprint start",
      label: sprint.startedAt.toLocaleDateString(),
      tooltip: "Sprint start date",
      colour: neutral,
      lineDays: 0,
      elapsedDays: 0,
    });
  }

  for (const deadline of sprintDeadlines) {
    candidates.push({
      key: `deadline-${deadline.day}-${deadline.name}`,
      name: deadline.name,
      label: deadline.name,
      tooltip: `${deadline.name}${deadline.description ? ` - ${deadline.description}` : ""} (end of day ${deadline.day})`,
      colour: deadline.colour,
      lineDays: deadline.day,
      elapsedDays: deadline.day,
      deadlineDay: deadline.day,
    });
  }

  if (sprint.completedAt) {
    candidates.push({
      key: "end",
      name: "Sprint end",
      label: sprint.completedAt.toLocaleDateString(),
      tooltip: "Sprint end date",
      colour: neutral,
      lineDays: elapsed,
      elapsedDays: elapsed,
    });
  }

  if (sprint.state !== State.COMPLETED) {
    // The red line marks the start of the day we're in. Half a day into
    // day 7 is still day 7, so the line stays on day 7's left edge and
    // the tooltip says how far through it we are.
    const day = currentDayNumber(elapsed);
    const intoDay = elapsed - (day - 1);
    const remaining = sprint.daysRemaining;
    const left =
      remaining > 0
        ? `${formatDays(remaining)} left of ${formatDays(sprint.days)}`
        : remaining === 0
          ? "no planned days left"
          : `${formatDays(-remaining)} over the ${formatDays(sprint.days)} planned`;
    candidates.push({
      key: "current",
      name: "Current Day",
      label: `Day ${day}`,
      tooltip: `Current day: day ${day}${intoDay > 0 ? ` (${intoDay === 0.5 ? "half" : `${Math.round(intoDay * 100)}%`} done)` : ""}, ${left}`,
      colour: "red",
      lineDays: currentDayLineDays(elapsed),
      elapsedDays: elapsed,
    });
  }

  return candidates.flatMap((marker) => {
    const percent = percentForElapsedDays(scale, marker.lineDays);
    return percent === null ? [] : [{ ...marker, percent }];
  });
};
