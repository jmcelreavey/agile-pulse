import { type DraggableProvided } from "@hello-pangea/dnd";
import {
  Flex,
  HoverCard,
  Progress,
  type ProgressSectionProps,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import React from "react";
import { useDeliveryChartContext } from "~/app/components/sprint/chart/DeliveryChartContext";
import UpdateSprintTaskModal from "~/app/components/sprint/task/UpdateSprintTaskModal";
import { useTaskContextMenu } from "~/app/hooks/useTaskContextMenu";
import { type GetSprintTasksUseCaseType } from "~/server/logic/sprint/GetSprintTasksUseCase";
import { State } from "~/shared/types/State";
import { DeliveryChartTaskDropdown } from "~/app/components/sprint/chart/DeliveryChartTaskDropdown";

export const DeliveryChartTaskProgress = ({
  task,
  ...props
}: {
  task: GetSprintTasksUseCaseType[0];
  provided?: DraggableProvided;
} & ProgressSectionProps) => {
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const { sprint } = useDeliveryChartContext();
  const isComplete = sprint.state === State.COMPLETED;

  const handleEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    openModal();
  };

  const { handleContextMenu } = useTaskContextMenu({
    task,
    onEdit: handleEdit,
  });

  return (
    <Progress.Section
      {...props}
      ref={props.provided?.innerRef}
      {...props.provided?.dragHandleProps}
      {...props.provided?.draggableProps}
      onContextMenu={handleContextMenu}
      aria-label={`${task.name}, ${task.days} ${task.days === 1 ? "day" : "days"}, ${task.state}`}
      onKeyDown={(event: React.KeyboardEvent) => {
        if (event.key === "Enter" && !isComplete && !props.provided?.draggableProps.style?.transform) {
          event.preventDefault();
          openModal();
        }
      }}
    >
      <HoverCard
        openDelay={150}
        position="bottom"
        withArrow
        width={800}
        styles={{
          dropdown: {
            maxHeight: "600px",
            overflow: "auto",
            scrollbarWidth: "none", // Firefox
            msOverflowStyle: "none", // IE/Edge
            "&::WebkitScrollbar": {
              display: "none", // Chrome/Safari
            },
          },
        }}
      >
        <HoverCard.Target>
          <Flex justify="center" align="center" w="100%" h="100%">
            <Progress.Label
              style={{ textShadow: "0 0 5px black" }}
              fw={500}
              fz={18}
            >
              {task.name}
            </Progress.Label>
          </Flex>
        </HoverCard.Target>
        <HoverCard.Dropdown p="md">
          <DeliveryChartTaskDropdown
            task={task}
            isComplete={isComplete}
            onEdit={handleEdit}
          />
        </HoverCard.Dropdown>
      </HoverCard>
      <UpdateSprintTaskModal
        opened={modalOpened}
        onClose={closeModal}
        sprint={sprint}
        sprintTask={task}
      />
    </Progress.Section>
  );
};
