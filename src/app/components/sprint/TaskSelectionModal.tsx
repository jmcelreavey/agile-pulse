"use client";

import {
  Badge,
  Button,
  Checkbox,
  Group,
  Modal,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { useSprintTaskSelection } from "~/hooks/useSprintTaskSelection";
import { EmptyState } from "~/app/components/shared/EmptyState";
import { State } from "~/shared/types/State";

interface TaskSelectionModalProps {
  sprintId: number;
  projectId: number;
  opened: boolean;
  onClose: () => void;
  onSelectionComplete?: (taskIds: number[]) => void;
  isProcessing?: boolean; // Add loading state prop
}

export const TaskSelectionModal = ({
  sprintId,
  projectId: _projectId,
  opened,
  onClose,
  onSelectionComplete,
  isProcessing = false,
}: TaskSelectionModalProps) => {
  const {
    sprintTasks,
    isLoading,
    selectedTasks,
    handleTaskToggle,
    handleSelectAll,
    handleDeselectAll,
  } = useSprintTaskSelection(sprintId);

  const handleGenerate = () => {
    if (selectedTasks.length === 0) return;

    if (onSelectionComplete) {
      onSelectionComplete(selectedTasks);
    } else {
      // Fallback behavior for backward compatibility
      console.log("Generating changelog for tasks:", selectedTasks);
      onClose();
    }
  };

  const getStateColor = (state: State) => {
    switch (state) {
      case State.COMPLETED:
        return "green";
      case State.IN_PROGRESS:
        return "blue";
      case State.NOT_STARTED:
        return "gray";
      default:
        return "gray";
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600}>Select Tasks for Changelog</Text>}
      size="lg"
      closeOnClickOutside={false}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Select which tasks to include in the changelog. Completed tasks are
          selected by default.
        </Text>

        {/* Selection controls */}
        <Group justify="space-between">
          <Group gap="sm">
            <Button variant="subtle" size="xs" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="subtle" size="xs" onClick={handleDeselectAll}>
              Deselect All
            </Button>
          </Group>
          <Text size="sm" c="dimmed">
            {selectedTasks.length} of {sprintTasks?.length || 0} tasks selected
          </Text>
        </Group>

        {/* Task list */}
        {isLoading ? (
          <Text>Loading tasks...</Text>
        ) : sprintTasks && sprintTasks.length > 0 ? (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 40 }}></Table.Th>
                <Table.Th>Task</Table.Th>
                <Table.Th>Assignee</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sprintTasks.map((task) => (
                <Table.Tr key={task.id}>
                  <Table.Td>
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => handleTaskToggle(task.id)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Text fw={500}>{task.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{task.assignedTo}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStateColor(task.state)} size="sm">
                      {task.state}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <EmptyState
            title="No tasks found"
            description="Add tasks to this sprint to create a changelog."
            withBorder={false}
            padding="lg"
          />
        )}

        {/* Actions */}
        <Group justify="end" gap="sm">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={selectedTasks.length === 0 || isProcessing}
            loading={isProcessing}
          >
            Continue
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
