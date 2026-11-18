import { useMantineColorScheme } from "@mantine/core";
import { useDeliveryChartContext } from "~/app/components/sprint/chart/DeliveryChartContext";
import { DeliveryChartDeadline } from "~/app/components/sprint/chart/DeliveryChartDeadline";

export const DeliveryChartEndDayLine = () => {
  const { sprint } = useDeliveryChartContext();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  if (!sprint.completedAt) {
    return null;
  }

  const endDay = sprint.days - sprint.daysRemaining;

  return (
    <DeliveryChartDeadline
      name={sprint.completedAt.toLocaleDateString()}
      description="Sprint end date"
      colour={isDark ? "gray.6" : "black"}
      day={endDay}
    />
  );
};
