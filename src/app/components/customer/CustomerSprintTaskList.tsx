"use client";

import {
  Badge,
  Box,
  Divider,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import ReadOnlyRichTextEditor from "~/app/components/base/rich-text-editor/ReadOnlyRichTextEditor";
import { EmptyState } from "~/app/components/shared/EmptyState";
import { State } from "~/shared/types/State";

interface CustomerSprintTask {
  id: number;
  name: string;
  description: string;
  state: State;
  assignedTo: string;
}

interface CustomerSprintTaskListProps {
  tasks: CustomerSprintTask[];
  sprintName: string;
  progressPercentage: number;
  completedTasks: number;
  totalTasks: number;
}

export function CustomerSprintTaskList({
  tasks,
  sprintName,
  progressPercentage,
  completedTasks,
  totalTasks,
}: CustomerSprintTaskListProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedTask, setSelectedTask] = useState<CustomerSprintTask | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleTaskClick = (task: CustomerSprintTask) => {
    setSelectedTask(task);
    open();
  };

  // Get customer-friendly state
  const getCustomerState = (
    state: State
  ): "todo" | "inprogress" | "completed" => {
    switch (state) {
      case State.COMPLETED:
        return "completed";
      case State.NOT_STARTED:
      case State.BLOCKED:
      case State.AT_RISK:
        return "todo";
      case State.IN_PROGRESS:
      case State.WITH_QA:
      case State.SIGN_OFF_REQUIRED:
        return "inprogress";
      default:
        return "todo";
    }
  };

  // Get color code for customer state
  const getStatusColor = (state: State): string => {
    const customerState = getCustomerState(state);
    switch (customerState) {
      case "completed":
        return "green";
      case "inprogress":
        return "blue";
      case "todo":
        return "gray";
      default:
        return "gray";
    }
  };

  const getStatusLabel = (state: State): string => {
    const customerState = getCustomerState(state);
    switch (customerState) {
      case "completed":
        return "Completed";
      case "inprogress":
        return "In Progress";
      case "todo":
        return "To Do";
      default:
        return "To Do";
    }
  };

  // Filter out internal team states that customers shouldn't see
  const customerVisibleTasks = tasks.filter((task) => {
    return task.state !== State.LEAVE && task.state !== State.DISTRACTION;
  });

  // Filter tasks based on search term and status using customer states
  const filteredTasks = customerVisibleTasks.filter((task) => {
    const matchesSearch =
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    const customerState = getCustomerState(task.state);
    const matchesStatus =
      statusFilter === "all" || customerState === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Paper p="xl" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={3}>{sprintName} Tasks</Title>
          <Badge
            size="lg"
            color={progressPercentage === 100 ? "green" : "blue"}
          >
            {completedTasks} / {totalTasks} Completed
          </Badge>
        </Group>

        <Divider />

        {/* Search and Filter Controls */}
        <Group gap="md">
          <TextInput
            placeholder="Search tasks, descriptions, or assignees..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by status"
            data={[
              { value: "all", label: "All Statuses" },
              { value: "todo", label: "To Do" },
              { value: "inprogress", label: "In Progress" },
              { value: "completed", label: "Completed" },
            ]}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value ?? "all")}
            clearable
            w={200}
          />
        </Group>

        {/* Results summary for filtered view */}
        {(searchTerm || statusFilter !== "all") && (
          <Text size="sm" c="dimmed">
            Showing {filteredTasks.length} of {customerVisibleTasks.length}{" "}
            tasks
          </Text>
        )}

        {filteredTasks.length === 0 ? (
          <EmptyState
            title={
              customerVisibleTasks.length === 0
                ? "No tasks added yet"
                : "No tasks found"
            }
            description={
              customerVisibleTasks.length === 0
                ? "Tasks will appear here as the team adds them to this sprint."
                : "Try adjusting your search or filter criteria."
            }
            withBorder={false}
            padding="xl"
          />
        ) : (
          <Stack gap="sm">
            {filteredTasks.map((task) => (
              <Paper
                key={task.id}
                p="md"
                withBorder
                style={{
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                styles={(theme) => ({
                  root: {
                    "&:hover": {
                      backgroundColor: theme.colors.gray[0],
                      transform: "translateY(-1px)",
                      boxShadow: theme.shadows.sm,
                    },
                  },
                })}
                onClick={() => handleTaskClick(task)}
              >
                <Stack gap="xs">
                  <Group justify="space-between" align="flex-start">
                    <Text fw={600} size="md" style={{ flex: 1 }}>
                      {task.name}
                    </Text>
                    <Badge
                      variant="light"
                      color={getStatusColor(task.state)}
                      size="sm"
                    >
                      {getStatusLabel(task.state)}
                    </Badge>
                  </Group>

                  <Text size="sm" c="dimmed" lineClamp={2} component="div">
                    {task.description ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            task.description
                              .replace(/<[^>]*>/g, "")
                              .substring(0, 120) +
                            (task.description.length > 120 ? "..." : ""),
                        }}
                      />
                    ) : (
                      "No description provided"
                    )}
                  </Text>

                  <Group gap="md" justify="space-between">
                    <Text size="xs" c="dimmed">
                      Assigned to: {task.assignedTo}
                    </Text>
                  </Group>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>

      {/* Task Detail Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={
          <Group gap="sm">
            <Text fw={600}>{selectedTask?.name}</Text>
            {selectedTask && (
              <Badge
                variant="light"
                color={getStatusColor(selectedTask.state)}
                size="sm"
              >
                {getStatusLabel(selectedTask.state)}
              </Badge>
            )}
          </Group>
        }
        size="lg"
      >
        {selectedTask && (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Assigned to:{" "}
              <Text span fw={500}>
                {selectedTask.assignedTo}
              </Text>
            </Text>

            {selectedTask.description && (
              <Box>
                <Text fw={500} mb="xs">
                  Description
                </Text>
                <ReadOnlyRichTextEditor content={selectedTask.description} />
              </Box>
            )}
          </Stack>
        )}
      </Modal>
    </Paper>
  );
}
