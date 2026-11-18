import {
  Box,
  Card,
  Collapse,
  Group,
  Table,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { type FC, useMemo, useState } from "react";
import { useDeliveryChartContext } from "~/app/components/sprint/chart/DeliveryChartContext";
import UpdateSprintTaskModal from "~/app/components/sprint/task/UpdateSprintTaskModal";
import { useTaskContextMenu } from "~/app/hooks/useTaskContextMenu";
import { type GetSprintTasksUseCaseType } from "~/server/logic/sprint/GetSprintTasksUseCase";
import { getStateColour } from "~/shared/types/State";

// Separate component for each task row to properly use hooks
const UnassignedTaskRow: FC<{
  task: GetSprintTasksUseCaseType[0];
  onTaskClick: (task: GetSprintTasksUseCaseType[0]) => void;
  onEdit: (task: GetSprintTasksUseCaseType[0]) => void;
  isDisabled?: boolean;
}> = ({ task, onTaskClick, onEdit, isDisabled = false }) => {
  const { handleContextMenu } = useTaskContextMenu({
    task,
    onEdit: () => onEdit(task),
  });

  return (
    <Table.Tr
      onClick={() => onTaskClick(task)}
      onContextMenu={handleContextMenu}
      style={{
        cursor: isDisabled ? "default" : "pointer",
      }}
    >
      <Table.Td>{task.name}</Table.Td>
      <Table.Td>{task.days}</Table.Td>
      <Table.Td style={{ color: getStateColour(task.state) }}>
        {task.state}
      </Table.Td>
    </Table.Tr>
  );
};

export const DeliveryChartUnassignedCard: FC<{
  sprintTasks: GetSprintTasksUseCaseType;
}> = ({ sprintTasks }) => {
  const { isDisabled, sprint } = useDeliveryChartContext();
  const [opened, { toggle }] = useDisclosure(false);
  const [selectedTask, setSelectedTask] = useState<
    GetSprintTasksUseCaseType[0] | null
  >(null);
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
    useDisclosure(false);

  const handleTaskClick = (task: GetSprintTasksUseCaseType[0]) => {
    if (!isDisabled) {
      setSelectedTask(task);
      openEditModal();
    }
  };

  const handleEdit = (task: GetSprintTasksUseCaseType[0]) => {
    setSelectedTask(task);
    openEditModal();
  };

  // Sort unassigned tasks by order
  const sortedTasks = useMemo(
    () => [...sprintTasks].sort((a, b) => a.order - b.order),
    [sprintTasks]
  );

  return (
    <Card mb={8} withBorder shadow="md">
      <Box>
        <UnstyledButton onClick={toggle} style={{ width: "100%" }}>
          <Group justify="space-between">
            <Text mb={4} size="md" fw={500}>
              Unassigned Tasks: {sprintTasks.length}
            </Text>
            {opened ? (
              <IconChevronDown size={16} />
            ) : (
              <IconChevronRight size={16} />
            )}
          </Group>
        </UnstyledButton>
        <Collapse expanded={opened}>
          {sprintTasks.length === 0 ? (
            <Text size="sm">No unassigned tasks</Text>
          ) : (
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Task</Table.Th>
                  <Table.Th>Days</Table.Th>
                  <Table.Th>State</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sortedTasks.map((task) => (
                  <UnassignedTaskRow
                    key={task.id}
                    task={task}
                    onTaskClick={handleTaskClick}
                    onEdit={handleEdit}
                    isDisabled={isDisabled}
                  />
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Collapse>
        {selectedTask && (
          <UpdateSprintTaskModal
            opened={editModalOpened}
            onClose={closeEditModal}
            sprint={sprint}
            sprintTask={selectedTask}
          />
        )}
      </Box>
    </Card>
  );
};
