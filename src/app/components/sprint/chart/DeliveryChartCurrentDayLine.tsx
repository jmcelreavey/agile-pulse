import { useDeliveryChartContext } from "~/app/components/sprint/chart/DeliveryChartContext";
import { DeliveryChartDeadline } from "~/app/components/sprint/chart/DeliveryChartDeadline";
import { elapsedSprintDays } from "~/shared/logic/sprint/chart/timelineScale";
import { State } from "~/shared/types/State";

export const DeliveryChartCurrentDayLine = () => {
  const { sprint } = useDeliveryChartContext();

  if (sprint.state === State.COMPLETED) {
    return null;
  }

  const elapsed = elapsedSprintDays(sprint);
  const remaining = sprint.daysRemaining;
  const description =
    remaining > 0
      ? `${formatDays(remaining)} left of ${formatDays(sprint.days)}`
      : remaining === 0
        ? "No planned days left"
        : `${formatDays(-remaining)} over the ${formatDays(sprint.days)} planned`;

  return (
    <DeliveryChartDeadline
      name="Current Day"
      description={description}
      colour="red"
      day={elapsed}
    />
  );
};

const formatDays = (days: number) => `${days} day${days === 1 ? "" : "s"}`;
