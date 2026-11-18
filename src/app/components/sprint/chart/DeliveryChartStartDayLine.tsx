import { useMantineColorScheme } from "@mantine/core";
import { useDeliveryChartContext } from "~/app/components/sprint/chart/DeliveryChartContext";
import { DeliveryChartDeadline } from "~/app/components/sprint/chart/DeliveryChartDeadline";

export const DeliveryChartStartDayLine = () => {
  const { sprint } = useDeliveryChartContext();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  if (!sprint.startedAt) {
    return null;
  }

  return (
    <DeliveryChartDeadline
      name={sprint.startedAt.toLocaleDateString()}
      description="Sprint start date"
      colour={isDark ? "gray.6" : "black"}
      day={0}
    />
  );
};
