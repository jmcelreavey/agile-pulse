import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { Box, Button, Card, Loader } from "@mantine/core";
import { IconZoomCancel } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { EmptyState } from "~/app/components/shared/EmptyState";
import { type GetOneProjectUseCaseType } from "~/server/logic/project/GetOneProjectUseCase";
import { type GetOneSprintUseCaseType } from "~/server/logic/sprint/GetOneSprintUseCase";
import { type GetSprintDeadlinesUseCaseType } from "~/server/logic/sprint/GetSprintDeadlinesUseCase";
import { type GetSprintMembersUseCaseType } from "~/server/logic/sprint/GetSprintMembersUseCase";
import { type GetSprintTasksUseCaseType } from "~/server/logic/sprint/GetSprintTasksUseCase";
import {
  DeliveryChartProvider,
  useDeliveryChartContext,
} from "~/app/components/sprint/chart/DeliveryChartContext";
import { DeliveryChartLines } from "~/app/components/sprint/chart/DeliveryChartLines";
import { DeliveryChartLegend } from "~/app/components/sprint/chart/DeliveryChartLegend";
import { DeliveryChartMemberCard } from "~/app/components/sprint/chart/DeliveryChartMemberCard";
import { DeliveryChartTimeline } from "~/app/components/sprint/chart/DeliveryChartTimeline";
import { DeliveryChartUnassignedCard } from "~/app/components/sprint/chart/DeliveryChartUnassignedCard";

type DeliveryChartProps = {
  members: GetSprintMembersUseCaseType;
  sprint: GetOneSprintUseCaseType;
  sprintDeadlines: GetSprintDeadlinesUseCaseType;
  project: GetOneProjectUseCaseType;
  sprintTasks?: GetSprintTasksUseCaseType;
  unassignedTasks?: GetSprintTasksUseCaseType;
  isLoading?: boolean;
  isDisabled?: boolean;
  zoomDay?: number;
};

export const DeliveryChart = ({
  members,
  sprint,
  sprintDeadlines,
  isLoading,
  isDisabled,
  project,
  sprintTasks = [],
  unassignedTasks = [],
  zoomDay,
}: DeliveryChartProps) => (
  <DeliveryChartProvider
    project={project}
    sprintDeadlines={sprintDeadlines}
    members={members}
    sprint={sprint}
    sprintTasks={sprintTasks}
    unassignedTasks={unassignedTasks}
    isLoading={isLoading}
    isDisabled={isDisabled}
    zoomDay={zoomDay}
  >
    <DeliveryChartContent />
  </DeliveryChartProvider>
);

const DeliveryChartContent = () => {
  const {
    localMembers,
    sprint,
    isLoading,
    updateTasksOrder,
    updateMembersOrder,
    unassignedTasks,
  } = useDeliveryChartContext();
  const router = useRouter();

  const noRecords = localMembers.length === 0 && unassignedTasks.length === 0;

  const sortedMembers = useMemo(() => {
    return [...localMembers].sort((a, b) => a.order - b.order);
  }, [localMembers]);

  const handleDragEnd = async ({
    destination,
    draggableId,
    source,
    type,
  }: DropResult) => {
    if (
      !destination ||
      (source.index === destination.index &&
        source.droppableId === destination.droppableId)
    ) {
      return;
    }

    if (type === "MEMBER") {
      const memberOrder = {
        sprintId: sprint.id,
        sprintMemberId: parseInt(draggableId),
        order: destination.index,
      };

      void updateMembersOrder(memberOrder);
    }

    if (type === "TASK") {
      if (
        source.droppableId === "unassigned" &&
        destination.droppableId === "unassigned"
      ) {
        return;
      }

      const newSprintMemberId =
        destination.droppableId === "unassigned"
          ? null
          : parseInt(destination.droppableId);

      const taskOrder = {
        sprintId: sprint.id,
        sprintTaskId: parseInt(draggableId),
        sprintMemberId: newSprintMemberId ?? 0,
        order: destination.index,
      };

      void updateTasksOrder(taskOrder);
    }
  };

  if (!localMembers && isLoading) {
    return (
      <Box ta="center">
        <Loader />
      </Box>
    );
  }

  if (noRecords) {
    return (
      <Card withBorder shadow="md" p={32}>
        <EmptyState
          title="No members or tasks found"
          description="Add a member & task to get started!"
        />
      </Card>
    );
  }

  return (
    <DragDropContext
      onDragEnd={handleDragEnd}
      dragHandleUsageInstructions="Press space to pick up the task. Use the left and right arrow keys to move it along the lane, up and down to move it to another person, space to drop it, or escape to cancel. Press enter to edit the task."
    >
      {unassignedTasks.length > 0 && (
        <Box mb={16}>
          <DeliveryChartUnassignedCard sprintTasks={unassignedTasks} />
        </Box>
      )}
      <Card withBorder shadow="md" p={32} pt={16}>
        {sprint.isZoomed && (
          <Box mb={8}>
            <Button
              leftSection={<IconZoomCancel size={16} />}
              variant="light"
              size="xs"
              onClick={() =>
                router.push(
                  `/projects/${sprint.projectId}/sprints/${sprint.id}`,
                  { scroll: false },
                )
              }
            >
              Reset Zoom
            </Button>
          </Box>
        )}
        <Box pos="relative">
          <DeliveryChartLines />
          <DeliveryChartTimeline />
          <DeliveryChartLegend />
          {sortedMembers.map((member, index) => (
            <DeliveryChartMemberCard
              key={index}
              member={member}
              sprintTasks={member.tasks}
            />
          ))}
        </Box>
      </Card>
    </DragDropContext>
  );
};
