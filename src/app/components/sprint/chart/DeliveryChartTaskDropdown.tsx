"use client";

import { ActionIcon, Divider, Group, Stack, Text } from "@mantine/core";
import { IconExternalLink, IconPencil } from "@tabler/icons-react";
import Link from "next/link";
import { SiJira } from "react-icons/si";
import ReadOnlyRichTextEditor from "~/app/components/base/rich-text-editor/ReadOnlyRichTextEditor";
import { useDeliveryChartContext } from "~/app/components/sprint/chart/DeliveryChartContext";
import { type GetSprintTasksUseCaseType } from "~/server/logic/sprint/GetSprintTasksUseCase";
import { GetJiraURLUtil } from "~/shared/logic/jira/GetJiraTaskURLUtil";
import { api } from "~/trpc/react";

interface DeliveryChartTaskDropdownProps {
  task: GetSprintTasksUseCaseType[0];
  isComplete: boolean;
  onEdit: (e: React.MouseEvent) => void;
}

export const DeliveryChartTaskDropdown = ({
  task,
  isComplete,
  onEdit,
}: DeliveryChartTaskDropdownProps) => {
  const { project } = useDeliveryChartContext();
  const jiraConnectionStatus = api.jira.getConnectionStatus.useQuery();

  // Generate Jira URL if task has jiraIssueKey and project is linked to Jira
  const jiraUrl =
    task.jiraIssueKey &&
    project.jiraProjectKey &&
    jiraConnectionStatus.data?.domain &&
    jiraConnectionStatus.data?.isConnected
      ? GetJiraURLUtil({
          key: task.jiraIssueKey,
          domain: jiraConnectionStatus.data.domain || "",
        })
      : "";

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Text fw={700} size="sm">
          {task.name}
        </Text>
        <Group gap="xs">
          {task.ticketUrl && (
            <ActionIcon
              variant="light"
              color="blue"
              component={Link}
              href={task.ticketUrl}
              target="_blank"
              aria-label="Open ticket"
              title="Open ticket in new tab"
            >
              <IconExternalLink size={16} />
            </ActionIcon>
          )}
          {jiraUrl && (
            <ActionIcon
              variant="light"
              color="blue"
              component={Link}
              href={jiraUrl}
              target="_blank"
              aria-label="Open Jira ticket"
              title="Open Jira ticket in new tab"
            >
              <SiJira size={16} />
            </ActionIcon>
          )}
          {!isComplete && (
            <ActionIcon
              variant="light"
              onClick={onEdit}
              aria-label="Edit task"
              title="Edit task"
            >
              <IconPencil size={16} />
            </ActionIcon>
          )}
        </Group>
      </Group>

      <Stack gap="xs">
        <Group gap="xl">
          <Group gap="xs">
            <Text size="sm" fw={600} c="dimmed">
              Estimate:
            </Text>
            <Text size="sm">{task.days} days</Text>
          </Group>
        </Group>
      </Stack>
      {task.description && (
        <>
          <Divider />
          <ReadOnlyRichTextEditor content={task.description} compact={true} />
        </>
      )}
    </Stack>
  );
};
