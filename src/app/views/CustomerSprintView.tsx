"use client";

import { Badge, Button, Group, Paper, Stack, Text } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { CustomerSprintChangelogs } from "~/app/components/customer/CustomerSprintChangelogs";
import { CustomerSprintProgress } from "~/app/components/customer/CustomerSprintProgress";
import { CustomerSprintTaskList } from "~/app/components/customer/CustomerSprintTaskList";
import { DiscussionSection } from "~/app/components/customer/DiscussionSection";
import { EntityHeader } from "~/app/components/shared/EntityHeader";
import { useCustomerSprintDetailQueries } from "~/app/hooks/useCustomerSprintQueries";
import { State } from "~/shared/types/State";

interface CustomerSprintViewProps {
  sprintId: number;
  projectId: number;
}

export function CustomerSprintView({
  sprintId,
  projectId,
}: CustomerSprintViewProps) {
  const { sprint, isLoading } = useCustomerSprintDetailQueries({
    projectId,
    sprintId,
  });

  if (isLoading) {
    return <Text>Loading sprint details...</Text>;
  }

  if (!sprint) {
    return (
      <Stack gap="md">
        <Group>
          <Button
            component={Link}
            href={`/customer/project/${projectId}`}
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
          >
            Back to Project
          </Button>
        </Group>
        <Paper p="xl" withBorder>
          <Text ta="center">
            Sprint not found or you don&apos;t have access to view it.
          </Text>
        </Paper>
      </Stack>
    );
  }

  return (
    <Stack gap="xl">
      {/* Navigation Header */}
      <Group>
        <Button
          component={Link}
          href={`/customer/project/${projectId}`}
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
        >
          Back to Project
        </Button>
      </Group>

      {/* Sprint Header */}
      <EntityHeader
        entity={{
          name: `Sprint ${sprint.reference}`,
          state: sprint.state,
          colour: sprint.project.colour,
          description: sprint.project.description,
          startedAt: sprint.startedAt,
        }}
        rightElement={
          <Badge size="lg" variant="light" color="blue">
            {sprint.state !== State.COMPLETED &&
            sprint.state !== State.IN_PROGRESS
              ? "Not Started"
              : sprint.state}
          </Badge>
        }
        showDate={true}
        isCustomerView={true}
        subtitle={`${sprint.project.name}`}
      />

      {/* Sprint Progress Overview */}
      <CustomerSprintProgress sprint={sprint} />

      {/* Sprint Tasks */}
      <CustomerSprintTaskList
        tasks={sprint.tasks}
        sprintName={`Sprint ${sprint.reference}`}
        progressPercentage={sprint.metrics.progressPercentage}
        completedTasks={sprint.metrics.completedTasks}
        totalTasks={sprint.metrics.totalTasks}
      />

      {/* Published Changelogs */}
      <CustomerSprintChangelogs
        changelogs={sprint.changelogs}
        sprintName={`Sprint ${sprint.reference}`}
        projectId={projectId}
        sprintId={sprintId}
      />

      {/* Sprint Discussion Section */}
      <Paper p="xl" withBorder>
        <DiscussionSection
          projectId={projectId.toString()}
          sprintId={sprintId.toString()}
          title={`Sprint ${sprint.reference} Discussion`}
        />
      </Paper>
    </Stack>
  );
}
