"use client";

import { Button, Flex, Group, Progress } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { IconZoomCancel } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { DeliveryChartCurrentDayLine } from "~/app/components/sprint/chart/DeliveryChartCurrentDayLine";
import { DeliveryChartEndDayLine } from "~/app/components/sprint/chart/DeliveryChartEndDayLine";
import { DeliveryChartStartDayLine } from "~/app/components/sprint/chart/DeliveryChartStartDayLine";
import { useDeliveryChartContext } from "~/app/components/sprint/chart/DeliveryChartContext";
import { DeliveryChartDeadline } from "~/app/components/sprint/chart/DeliveryChartDeadline";
import { DeliveryChartTimelineHeader } from "~/app/components/sprint/chart/DeliveryChartTimelineHeader";

export const DeliveryChartTimeline = () => {
  const { setChartWidth, setSectionWidths, sprintDeadlines, members, sprint } =
    useDeliveryChartContext();
  const { ref, width } = useElementSize();
  const progressRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (width) {
      setChartWidth(width);
    }
  }, [width, setChartWidth]);

  // Measure actual section widths after render
  useEffect(() => {
    if (progressRef.current && width > 0) {
      const progressSections =
        progressRef.current.querySelectorAll('[class*="section"]');
      const widths = Array.from(progressSections).map((section) => {
        const rect = section.getBoundingClientRect();
        return rect.width;
      });
      if (widths.length > 0) {
        setSectionWidths(widths);
      }
    }
  }, [width, members, setSectionWidths]);

  // Map the days to include the required 'day' property
  const days = (members[0]?.timelineDays ?? []).map((day) => ({
    ...day,
    day: day.number, // Add the day property to match SprintDay type
  }));

  const handleResetZoom = () => {
    // Navigate to the same URL without the zoom parameter
    router.push(`/projects/${sprint.projectId}/sprints/${sprint.id}`, {
      scroll: false,
    });
  };

  return (
    <Group px={16} ref={ref} w="100%">
      {sprint.isZoomed && (
        <Button
          leftSection={<IconZoomCancel size={16} />}
          variant="light"
          size="xs"
          onClick={handleResetZoom}
        >
          Reset Zoom
        </Button>
      )}
      {sprintDeadlines.map((deadline, index) => {
        // Only show deadlines that fall within the visible days
        if (!days.some((d) => d.number === deadline.day)) {
          return null;
        }
        return (
          <DeliveryChartDeadline
            key={index}
            name={deadline.name}
            description={deadline.description}
            colour={deadline.colour}
            day={deadline.day}
            isDeadline
          />
        );
      })}
      <DeliveryChartCurrentDayLine />
      <DeliveryChartEndDayLine />
      <DeliveryChartStartDayLine />
      <Flex justify="space-between" align="center" w="100%">
        <Progress.Root ref={progressRef} size={50} w="100%">
          {days.map((day, index) => (
            <DeliveryChartTimelineHeader key={index} record={day} />
          ))}
        </Progress.Root>
      </Flex>
    </Group>
  );
};
