import { useDeliveryChartContext } from "~/app/components/sprint/chart/DeliveryChartContext";
import { DeliveryChartDeadline } from "~/app/components/sprint/chart/DeliveryChartDeadline";
import { State } from "~/shared/types/State";

export const DeliveryChartCurrentDayLine = () => {
  const { sprint } = useDeliveryChartContext();
  const currentDay = sprint.days - sprint.daysRemaining;

  if (sprint.state === State.COMPLETED) {
    return null;
  }

  return (
    <DeliveryChartDeadline name="Current Day" colour={"red"} day={currentDay} />
  );
};
