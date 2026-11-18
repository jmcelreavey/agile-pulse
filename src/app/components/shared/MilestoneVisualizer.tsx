"use client";

import {
  Badge,
  Box,
  Group,
  Paper,
  RingProgress,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { IconCheck, IconClock } from "@tabler/icons-react";
import Balancer from "react-wrap-balancer";

interface Milestone {
  id: number;
  title: string;
  description?: string;
  dueDate?: Date | null;
  completedAt?: Date | null;
  status: string;
}

interface MilestoneVisualizerProps {
  title?: string;
  milestones: Milestone[];
  showEmpty?: boolean;
}

export function MilestoneVisualizer({
  title = "Project Milestones",
  milestones,
  showEmpty = true,
}: MilestoneVisualizerProps) {
  const theme = useMantineTheme();

  // Calculate completion stats
  const completedMilestones = milestones.filter(
    (m) => m.status.toLowerCase() === "completed"
  ).length;
  const totalMilestones = milestones.length;
  const completionPercentage =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;

  // Get status color
  const getStatusColor = (status: string): string => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "completed") return theme.colors.green[6];
    if (lowerStatus === "in-progress" || lowerStatus === "in progress")
      return theme.colors.blue[6];
    return theme.colors.gray[6];
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string): string => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "completed") return "green";
    if (lowerStatus === "in-progress" || lowerStatus === "in progress")
      return "blue";
    return "gray";
  };

  if (milestones.length === 0 && !showEmpty) {
    return null;
  }

  return (
    <Paper p="xl" withBorder>
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={3}>{title}</Title>
          <RingProgress
            size={80}
            thickness={8}
            roundCaps
            sections={[
              { value: completionPercentage, color: theme.colors.green[6] },
            ]}
            label={
              <Box ta="center">
                <Text size="xs" c="dimmed">
                  Complete
                </Text>
                <Text fw={700}>{completionPercentage}%</Text>
              </Box>
            }
          />
        </Group>

        {milestones.length === 0 ? (
          <Text c="dimmed" ta="center" py="lg">
            <Balancer>
              No milestones have been set for this project yet.
            </Balancer>
          </Text>
        ) : (
          <Stack gap="md">
            {milestones.map((milestone) => (
              <Paper key={milestone.id} p="md" withBorder>
                <Group justify="space-between" align="flex-start">
                  <Box>
                    <Group gap="xs" align="center">
                      <Box
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          backgroundColor: getStatusColor(milestone.status),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {milestone.status.toLowerCase() === "completed" ? (
                          <IconCheck size={14} color="white" />
                        ) : (
                          <IconClock size={14} color="white" />
                        )}
                      </Box>
                      <Text fw={500}>{milestone.title}</Text>
                    </Group>
                    {milestone.description && (
                      <Text size="sm" c="dimmed" mt="xs">
                        {milestone.description}
                      </Text>
                    )}
                  </Box>
                  <Group gap="md">
                    <Badge
                      variant="light"
                      color={getStatusBadgeColor(milestone.status)}
                    >
                      {milestone.status}
                    </Badge>
                    {milestone.completedAt && (
                      <Text size="xs" c="dimmed">
                        Completed:{" "}
                        {new Date(milestone.completedAt).toLocaleDateString()}
                      </Text>
                    )}
                    {!milestone.completedAt && milestone.dueDate && (
                      <Text size="xs" c="dimmed">
                        Due: {new Date(milestone.dueDate).toLocaleDateString()}
                      </Text>
                    )}
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
