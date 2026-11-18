"use client";

import {
    Badge,
    Box,
    Button,
    Group,
    Paper,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { DiscussionSection } from "~/app/components/customer/DiscussionSection";
import SharedProjectSpace from "~/app/components/project/SharedProjectSpace";
import { EmptyState } from "~/app/components/shared/EmptyState";
import { EntityHeader } from "~/app/components/shared/EntityHeader";
import { useCustomerProjectDetailQueries } from "~/app/hooks/useCustomerQueries";

export default function CustomerProjectDetailView({
  projectId,
}: {
  projectId: number;
}) {
  const { project, isLoading } = useCustomerProjectDetailQueries({ projectId });

  if (isLoading) {
    return <Text>Loading project details...</Text>;
  }

  return (
    <Stack gap="xl">
      {/* Navigation Header */}
      <Group>
        <Button
          component={Link}
          href="/customer/dashboard"
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
        >
          Back to Dashboard
        </Button>
      </Group>

      <EntityHeader
        entity={{
          name: project.name,
          state: project.state,
          colour: project.colour,
          description: project.description,
          startedAt: project.startedAt,
        }}
        rightElement={
          <Badge size="lg" variant="light" color="blue">
            {project.state}
          </Badge>
        }
        showDate={true}
        isCustomerView={true}
      />

      {/* Shared Project Space - Only shows if content exists */}
      <SharedProjectSpace
        projectId={projectId}
        initialContent={project.sharedNotes ?? ""}
        isReadOnly={true}
      />

      {/* Project Progress Overview */}
      <Paper p="xl" withBorder>
        <Stack gap="md">
          <Title order={2}>Project Progress</Title>
          {project.sprints.length === 0 ? (
            <EmptyState
              title="No sprints created yet"
              description="The project team will create sprints as work begins."
              withBorder={false}
              padding="xl"
            />
          ) : (
            <Stack gap="sm">
              <Text size="sm" c="dimmed" mb="md">
                Here&apos;s an overview of the project&apos;s sprint progress.
                Each sprint represents a work cycle with specific goals and
                tasks.
              </Text>
              {project.sprints
                .sort((a, b) => {
                  // Sort by start date, with current/in-progress sprints first
                  if (a.state === "In Progress" && b.state !== "In Progress") return -1;
                  if (b.state === "In Progress" && a.state !== "In Progress") return 1;
                  if (a.startedAt && b.startedAt) {
                    return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
                  }
                  return b.id - a.id; // Fallback to ID
                })
                .map((sprint) => (
                <Paper 
                  key={sprint.id} 
                  p="md" 
                  withBorder
                  component={Link}
                  href={`/customer/project/${projectId}/sprints/${sprint.id}`}
                  style={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  styles={(theme) => ({
                    root: {
                      '&:hover': {
                        backgroundColor: theme.colors.gray[0],
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows.md,
                      },
                    },
                  })}
                >
                  <Group justify="space-between" align="center">
                    <Box>
                      <Text fw={500} c="dark">Sprint {sprint.reference}</Text>
                      <Text size="sm" c="dimmed">
                        {sprint._count.sprintTasks} task
                        {sprint._count.sprintTasks !== 1 ? "s" : ""} assigned
                      </Text>
                    </Box>
                    <Group gap="md" align="center">
                      <Badge
                        variant="light"
                        color={
                          sprint.state === "Completed"
                            ? "green"
                            : sprint.state === "In Progress"
                            ? "blue"
                            : "gray"
                        }
                      >
                        {sprint.state}
                      </Badge>
                      <Box ta="right">
                        {sprint.startedAt && (
                          <Text size="xs" c="dimmed">
                            Started:{" "}
                            {new Date(sprint.startedAt).toLocaleDateString()}
                          </Text>
                        )}
                        {sprint.completedAt && (
                          <Text size="xs" c="dimmed">
                            Completed:{" "}
                            {new Date(sprint.completedAt).toLocaleDateString()}
                          </Text>
                        )}
                      </Box>
                    </Group>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* Project Discussion Section */}
      <Paper p="xl" withBorder>
        <DiscussionSection
          projectId={projectId.toString()}
          title="Project Discussion"
        />
      </Paper>
    </Stack>
  );
}
