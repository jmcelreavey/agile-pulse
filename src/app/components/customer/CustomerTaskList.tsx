"use client";

import {
  Badge,
  Box,
  Divider,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { EmptyState } from "~/app/components/shared/EmptyState";

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority?: string;
  dueDate?: Date | null;
}

interface CustomerTaskListProps {
  tasks: Task[];
  sprintName?: string;
}

export function CustomerTaskList({ tasks, sprintName }: CustomerTaskListProps) {
  // Calculate progress percentage
  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;
  const totalTasks = tasks.length;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get color code for status
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "completed":
        return "green";
      case "in progress":
      case "in-progress":
        return "blue";
      case "blocked":
        return "red";
      case "pending":
      case "to do":
      case "todo":
        return "yellow";
      default:
        return "gray";
    }
  };

  return (
    <Paper p="xl" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={3}>
            {sprintName ? `${sprintName} Tasks` : "Tasks"}
          </Title>
          <Badge
            size="lg"
            color={progressPercentage === 100 ? "green" : "blue"}
          >
            {completedTasks} / {totalTasks} Completed
          </Badge>
        </Group>

        <Box mb="md">
          <Progress
            value={progressPercentage}
            color={progressPercentage === 100 ? "green" : "blue"}
            size="lg"
            radius="md"
            striped={progressPercentage < 100}
            animated={progressPercentage < 100}
          />
          <Text ta="center" size="sm" mt="xs" c="dimmed">
            {progressPercentage}% Complete
          </Text>
        </Box>

        <Divider />

        {tasks.length === 0 ? (
          <EmptyState
            title="No tasks found"
            description="Tasks will appear here as the team adds them to this project."
            withBorder={false}
            padding="xl"
          />
        ) : (
          <Stack gap="sm">
            {tasks.map((task) => (
              <Paper key={task.id} p="md" withBorder>
                <Group justify="space-between">
                  <Box style={{ flex: 1 }}>
                    <Text fw={500}>{task.title}</Text>
                    {task.description && (
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {task.description}
                      </Text>
                    )}
                  </Box>
                  <Group gap="md">
                    {task.priority && (
                      <Badge
                        variant="dot"
                        color={
                          task.priority.toLowerCase() === "high"
                            ? "red"
                            : task.priority.toLowerCase() === "medium"
                            ? "yellow"
                            : "blue"
                        }
                        size="sm"
                      >
                        {task.priority}
                      </Badge>
                    )}
                    <Badge variant="light" color={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
