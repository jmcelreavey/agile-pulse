"use client";

import {
    Badge,
    Box,
    Card,
    Flex,
    Group,
    Indicator,
    Progress,
    Text,
    Tooltip,
    rem,
} from "@mantine/core";
import {
    IconClock,
    IconLink,
    IconMail,
    IconShare,
} from "@tabler/icons-react";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { ProjectCompleteIndicator } from "~/app/components/shared/ProjectCompleteIndicator";
import { type GetOneProjectUseCaseType } from "~/server/logic/project/GetOneProjectUseCase";
import { type GetProjectSprintsUseCaseType } from "~/server/logic/project/GetProjectSprintsUseCase";
import { State } from "~/shared/types/State";

export function SprintCard({
  sprint,
  project,
}: {
  sprint: GetProjectSprintsUseCaseType[number];
  project: GetOneProjectUseCaseType;
}) {
  const hasJiraLink = !!(project.jiraProjectKey && project.jiraProjectId);
  const hasJiraSprint = !!sprint.jiraSprintId;
  const hasSyncedRecently =
    sprint.lastSyncedAt &&
    Date.now() - new Date(sprint.lastSyncedAt).getTime() < 24 * 60 * 60 * 1000; // Within 24 hours

  const getJiraSyncStatus = () => {
    if (!hasJiraLink) return null;

    if (!hasJiraSprint) {
      return {
        color: "gray",
        icon: IconLink,
        label: "Not linked to Jira sprint",
        text: "No Jira Sprint",
      };
    }

    if (!sprint.lastSyncedAt) {
      return {
        color: "yellow",
        icon: IconClock,
        label: "Linked to Jira but never synced",
        text: "Not Synced",
      };
    }

    if (hasSyncedRecently) {
      return {
        color: "green",
        icon: IconLink,
        label: `Last synced: ${new Date(sprint.lastSyncedAt).toLocaleString()}`,
        text: "Synced",
      };
    }

    return {
      color: "orange",
      icon: IconClock,
      label: `Last synced: ${new Date(sprint.lastSyncedAt).toLocaleString()}`,
      text: "Sync Outdated",
    };
  };

  const jiraSyncStatus = getJiraSyncStatus();
  const progressPercentage = sprint.totalTasks
    ? (sprint.totalCompletedTasks / sprint.totalTasks) * 100
    : 0;

  const getDaysLeftBadgeColor = () => {
    if (sprint.daysRemaining <= 0) return "red";
    if (sprint.daysRemaining <= 2) return "orange";
    if (sprint.daysRemaining <= 7) return "yellow";
    return "green";
  };

  return (
    <Indicator
      disabled={sprint.state !== State.COMPLETED}
      color={"transparent"}
      label={
        <ProjectCompleteIndicator
          startedAt={sprint.startedAt}
          completedAt={sprint.completedAt}
        />
      }
      inline
      position="top-center"
      size={32}
    >
      <Card
        withBorder
        shadow="md"
        component={Link}
        href={`/projects/${project.id}/sprints/${sprint.id}`}
        p={rem(16)}
      >
        <Flex direction="column" gap="md">
          {/* Header with Sprint name and Jira status */}
          <Flex justify="space-between" align="flex-start">
            <Text size="lg" fw={600}>
              <Balancer>Sprint {sprint.reference}</Balancer>
            </Text>
            {jiraSyncStatus && (
              <Tooltip label={jiraSyncStatus.label}>
                <Badge
                  size="xs"
                  variant="light"
                  color={jiraSyncStatus.color}
                  leftSection={<jiraSyncStatus.icon size={10} />}
                >
                  {jiraSyncStatus.text}
                </Badge>
              </Tooltip>
            )}
          </Flex>

          {/* Progress Section */}
          <Box>
            <Group justify="space-between" mb="xs">
              <Text c="dimmed" size="sm">
                Tasks completed
              </Text>
              <Text size="sm" fw={500}>
                {sprint.totalCompletedTasks} / {sprint.totalTasks}
              </Text>
            </Group>
            <Progress
              value={progressPercentage}
              size="lg"
              radius="md"
              color={progressPercentage === 100 ? "green" : "blue"}
            />
          </Box>

          {/* Footer with days remaining and changelog status */}
          <Group justify="space-between">
            <Group gap="xs">
              {/* Changelog Sharing Status */}
              {sprint.changelog.hasChangelog && (
                <Group gap="xs">
                  {sprint.changelog.sharedViaEmail && (
                    <Tooltip
                      label={`Shared via email ${
                        sprint.changelog.sharedAt
                          ? `on ${new Date(
                              sprint.changelog.sharedAt
                            ).toLocaleDateString()}`
                          : ""
                      }`}
                    >
                      <Badge
                        size="xs"
                        variant="light"
                        color="blue"
                        leftSection={<IconMail size={10} />}
                      >
                        Emailed
                      </Badge>
                    </Tooltip>
                  )}
                  {sprint.changelog.hasChangelog &&
                    !sprint.changelog.sharedViaEmail && (
                      <Tooltip
                        label={`Changelog created ${new Date(
                          sprint.changelog.createdAt
                        ).toLocaleDateString()}`}
                      >
                        <Badge
                          size="xs"
                          variant="light"
                          color="gray"
                          leftSection={<IconShare size={10} />}
                        >
                          Ready
                        </Badge>
                      </Tooltip>
                    )}
                </Group>
              )}
            </Group>

            <Group gap="xs">
              {sprint.state !== State.COMPLETED && (
                <Badge
                  variant="light"
                  color={getDaysLeftBadgeColor()}
                  size="sm"
                >
                  {sprint.daysRemaining > 0
                    ? `${sprint.daysRemaining} day${
                        sprint.daysRemaining !== 1 ? "s" : ""
                      } left`
                    : sprint.daysRemaining === 0
                    ? "Due today"
                    : `${Math.abs(sprint.daysRemaining)} day${
                        Math.abs(sprint.daysRemaining) !== 1 ? "s" : ""
                      } overdue`}
                </Badge>
              )}
            </Group>
          </Group>
        </Flex>
      </Card>
    </Indicator>
  );
}
