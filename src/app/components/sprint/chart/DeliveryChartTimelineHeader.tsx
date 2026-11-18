import { Button, Flex, Progress } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconZoomIn } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import React from "react";
import {
  type SprintDay,
  useDeliveryChartContext,
} from "~/app/components/sprint/chart/DeliveryChartContext";
import ManageSprintDeadlineModal from "~/app/components/sprint/ManageSprintDeadlineModal";
import classes from "~/app/styles/DeliveryChart.module.css";

export const DeliveryChartTimelineHeader = ({
  record,
}: {
  record: SprintDay;
}) => {
  const { sprint, sprintDeadlines, isDisabled, isZoomed } =
    useDeliveryChartContext();
  const [opened, { open, close }] = useDisclosure(false);
  const router = useRouter();

  const handleZoom = () => {
    router.push(
      `/projects/${sprint.projectId}/sprints/${sprint.id}?zoomDay=${record.day}`,
      {
        scroll: false,
      }
    );
  };

  return (
    <React.Fragment>
      <Progress.Section
        onClick={isDisabled ? undefined : open}
        className={classes.chartTask}
        striped={record.day > sprint.days}
        color={record.day > sprint.days ? "red" : undefined}
        value={record.percentage}
      >
        <Flex direction="column" gap={2}>
          <Progress.Label>{record.dayOfWeek || record.day}</Progress.Label>
          {!isDisabled && !isZoomed && (
            <Button
              variant="subtle"
              size="compact-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleZoom();
              }}
              mt={2}
              h={16}
            >
              <IconZoomIn color="white" size={16} />
            </Button>
          )}
        </Flex>
      </Progress.Section>

      <ManageSprintDeadlineModal
        opened={opened}
        onClose={close}
        deadline={sprintDeadlines.find((d) => d.day === record.day)}
        day={record.day}
      />
    </React.Fragment>
  );
};
