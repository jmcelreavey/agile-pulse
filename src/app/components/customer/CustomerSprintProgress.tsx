"use client";

import {
  Badge,
  Box,
  Flex,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { State } from "~/shared/types/State";

interface SprintProgressProps {
  sprint: {
    reference: string;
    state: State;
    days: number;
    daysRemaining: number;
    startedAt: Date | null;
    completedAt: Date | null;
    metrics: {
      totalTasks: number;
      completedTasks: number;
      inProgressTasks: number;
      progressPercentage: number;
    };
  };
}

export function CustomerSprintProgress({ sprint }: SprintProgressProps) {
  const getDaysLeftBadgeColor = () => {
    if (sprint.state === State.COMPLETED) return "green";
    if (sprint.daysRemaining <= 0) return "red";
    if (sprint.daysRemaining <= 2) return "orange";
    if (sprint.daysRemaining <= 7) return "yellow";
    return "green";
  };

  const getDaysLeftText = () => {
    if (sprint.state === State.COMPLETED) return "Completed";
    if (sprint.state === State.NOT_STARTED) return "Not Started";
    if (sprint.daysRemaining === 0) return "Due Today";
    if (sprint.daysRemaining < 0) {
      const overdueDays = Math.abs(sprint.daysRemaining);
      return `${overdueDays} day${overdueDays !== 1 ? "s" : ""} overdue`;
    }
    return `${sprint.daysRemaining} day${sprint.daysRemaining !== 1 ? "s" : ""} left`;
  };

  // Calculate remaining tasks
  const remainingTasks =
    sprint.metrics.totalTasks -
    sprint.metrics.completedTasks -
    sprint.metrics.inProgressTasks;

  // Create segments for visual progress
  const createProgressSegments = () => {
    const { completedTasks, inProgressTasks } = sprint.metrics;
    const totalTasks = sprint.metrics.totalTasks;

    if (totalTasks === 0) return [];

    const segments = [];

    // Completed tasks (green)
    if (completedTasks > 0) {
      segments.push({
        value: (completedTasks / totalTasks) * 100,
        color: "green",
        label: `${completedTasks} Completed`,
      });
    }

    // In progress tasks (blue)
    if (inProgressTasks > 0) {
      segments.push({
        value: (inProgressTasks / totalTasks) * 100,
        color: "blue",
        label: `${inProgressTasks} In Progress`,
      });
    }

    // Remaining tasks (gray)
    if (remainingTasks > 0) {
      segments.push({
        value: (remainingTasks / totalTasks) * 100,
        color: "gray",
        label: `${remainingTasks} To Do`,
      });
    }

    return segments;
  };

  const progressSegments = createProgressSegments();

  return (
    <Paper p="xl" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={3}>Sprint Progress</Title>
          <Badge variant="light" color={getDaysLeftBadgeColor()} size="lg">
            {getDaysLeftText()}
          </Badge>
        </Group>

        {/* Task Distribution Overview */}
        <SimpleGrid cols={3} spacing="md">
          <Paper p="md" withBorder style={{ backgroundColor: "#f0f9f0" }}>
            <Text size="xl" fw={700} c="green" ta="center">
              {sprint.metrics.completedTasks}
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              Completed
            </Text>
          </Paper>

          <Paper p="md" withBorder style={{ backgroundColor: "#f0f7ff" }}>
            <Text size="xl" fw={700} c="blue" ta="center">
              {sprint.metrics.inProgressTasks}
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              In Progress
            </Text>
          </Paper>

          <Paper p="md" withBorder style={{ backgroundColor: "#f8f9fa" }}>
            <Text size="xl" fw={700} c="gray" ta="center">
              {remainingTasks}
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              To Do
            </Text>
          </Paper>
        </SimpleGrid>

        {/* Segmented Progress Visualization */}
        {sprint.metrics.totalTasks > 0 && (
          <Box>
            <Group justify="space-between" mb="xs">
              <Text c="dimmed" size="sm">
                Work Distribution
              </Text>
              <Text size="sm" fw={500}>
                {sprint.metrics.completedTasks} of {sprint.metrics.totalTasks}{" "}
                tasks complete
              </Text>
            </Group>

            {progressSegments.length > 0 ? (
              <Progress.Root size="xl" radius="md">
                {progressSegments.map((segment, index) => (
                  <Progress.Section
                    key={index}
                    value={segment.value}
                    color={segment.color}
                  >
                    <Progress.Label>
                      {segment.value > 15 ? segment.label : ""}
                    </Progress.Label>
                  </Progress.Section>
                ))}
              </Progress.Root>
            ) : (
              <Paper p="md" withBorder>
                <Text ta="center" c="dimmed">
                  No tasks have been added to this sprint yet
                </Text>
              </Paper>
            )}

            {/* Legend */}
            <Group gap="xl" mt="xs" justify="center">
              <Flex align="center" gap="xs">
                <Box
                  w={12}
                  h={12}
                  style={{
                    backgroundColor: "var(--mantine-color-green-6)",
                    borderRadius: 2,
                  }}
                />
                <Text size="xs" c="dimmed">
                  Completed
                </Text>
              </Flex>
              <Flex align="center" gap="xs">
                <Box
                  w={12}
                  h={12}
                  style={{
                    backgroundColor: "var(--mantine-color-blue-6)",
                    borderRadius: 2,
                  }}
                />
                <Text size="xs" c="dimmed">
                  In Progress
                </Text>
              </Flex>
              <Flex align="center" gap="xs">
                <Box
                  w={12}
                  h={12}
                  style={{
                    backgroundColor: "var(--mantine-color-gray-6)",
                    borderRadius: 2,
                  }}
                />
                <Text size="xs" c="dimmed">
                  To Do
                </Text>
              </Flex>
            </Group>
          </Box>
        )}

        {/* Sprint Details */}
        <Group gap="xl" mt="md">
          <Box>
            <Text size="sm" c="dimmed" mb={4}>
              Sprint State
            </Text>
            <Badge
              variant="light"
              color={
                sprint.state === State.COMPLETED
                  ? "green"
                  : sprint.state === State.IN_PROGRESS
                    ? "blue"
                    : "gray"
              }
            >
              {sprint.state === State.COMPLETED
                ? "Completed"
                : sprint.state === State.IN_PROGRESS
                  ? "In Progress"
                  : "Not Started"}
            </Badge>
          </Box>

          {sprint.startedAt && (
            <Box>
              <Text size="sm" c="dimmed" mb={4}>
                Started
              </Text>
              <Text fw={500} size="sm">
                {new Date(sprint.startedAt).toLocaleDateString()}
              </Text>
            </Box>
          )}

          {sprint.completedAt && (
            <Box>
              <Text size="sm" c="dimmed" mb={4}>
                Completed
              </Text>
              <Text fw={500} size="sm">
                {new Date(sprint.completedAt).toLocaleDateString()}
              </Text>
            </Box>
          )}

          <Box>
            <Text size="sm" c="dimmed" mb={4}>
              Duration
            </Text>
            <Text fw={500} size="sm">
              {sprint.days} day{sprint.days !== 1 ? "s" : ""}
            </Text>
          </Box>
        </Group>
      </Stack>
    </Paper>
  );
}
