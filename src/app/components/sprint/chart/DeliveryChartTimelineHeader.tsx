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
import {
  type DayLabelMode,
  dayLabelText,
} from "~/shared/logic/sprint/chart/dayLabels";
import { plannedFractionOfDay } from "~/shared/logic/sprint/chart/timelineScale";

export const DeliveryChartTimelineHeader = ({
  record,
  mode,
}: {
  record: SprintDay;
  mode: DayLabelMode;
}) => {
  const { sprint, sprintDeadlines, isDisabled, isZoomed } =
    useDeliveryChartContext();
  const [opened, { open, close }] = useDisclosure(false);
  const router = useRouter();

  // Days past the plan are striped red. A part day (day 14 of a 13.5-day
  // sprint) is split at the exact point the plan ends.
  const planned = plannedFractionOfDay(sprint.days, record.day);
  const isPartDay = planned > 0 && planned < 1;
  const plannedPercent = `${planned * 100}%`;

  const label = dayLabelText(mode, {
    day: record.day,
    dayOfWeek: record.dayOfWeek,
    plannedFraction: planned,
  });
  const canZoom = !isDisabled && !isZoomed;

  const handleZoom = () => {
    router.push(
      `/projects/${sprint.projectId}/sprints/${sprint.id}?zoomDay=${record.day}`,
      {
        scroll: false,
      },
    );
  };

  return (
    <React.Fragment>
      <Progress.Section
        onClick={isDisabled ? undefined : open}
        className={classes.chartTask}
        striped={planned === 0}
        color={planned === 0 ? "red" : undefined}
        value={record.percentage}
        data-day={record.day}
        title={
          isPartDay
            ? `Day ${record.day}${record.dayOfWeek ? ` (${record.dayOfWeek})` : ""}: ${planned * 100}% inside the sprint`
            : `Day ${record.day}${record.dayOfWeek ? ` (${record.dayOfWeek})` : ""}`
        }
        style={
          isPartDay
            ? {
                backgroundImage: `linear-gradient(to right, transparent ${plannedPercent}, var(--mantine-color-red-filled) ${plannedPercent})`,
              }
            : undefined
        }
      >
        <Flex direction="column" gap={2} align="center" miw={0}>
          {label !== null && (
            <Progress.Label
              fz={mode === "full" ? undefined : 11}
              style={{ overflow: "visible", textOverflow: "clip" }}
              data-day-label=""
            >
              {label}
            </Progress.Label>
          )}
          {canZoom && mode === "full" && (
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
        onZoom={canZoom && mode !== "full" ? handleZoom : undefined}
      />
    </React.Fragment>
  );
};
