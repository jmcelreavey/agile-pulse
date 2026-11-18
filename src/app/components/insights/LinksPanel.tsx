"use client";

import { ActionIcon, Anchor, Badge, Button, Code, Group, Select, Skeleton, Stack, Table, Text, TextInput, Tooltip } from "@mantine/core";
import { IconBrandGithub, IconLink, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { SiJira } from "react-icons/si";
import { Hint } from "~/app/components/insights/shared";
import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { LINK_STATUS_LABEL } from "~/shared/logic/insights/links";
import { type LinkStatus } from "~/shared/logic/insights/types";
import { api } from "~/trpc/react";

const STATUS_COLOR: Record<LinkStatus, string> = {
  open: "blue",
  draft: "gray",
  in_review: "violet",
  merged: "green",
  closed: "red",
  done: "green",
};

const ago = (date: Date) => {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  return days <= 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;
};

export const LinksPanel = ({ sprintId, disabled }: { sprintId: number; disabled?: boolean }) => {
  const query = api.insights.links.useQuery({ sprintId });
  const integrations = api.insights.integrations.useQuery();
  const utils = api.useUtils();
  const [taskId, setTaskId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const refresh = () => void utils.insights.invalidate();
  const add = api.insights.addLink.useMutation({
    onSuccess: () => {
      setUrl("");
      refresh();
    },
    onError: (error) => ShowNotificationUtil({ message: error.message, isError: true }),
  });
  const remove = api.insights.removeLink.useMutation({ onSuccess: refresh });
  if (query.isLoading || !query.data) return <Skeleton h={240} />;
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  return (
    <Stack gap="lg">
      <Group align="flex-end" gap="xs" wrap="wrap">
        <Select
          label="Task"
          placeholder="Pick a task"
          searchable
          w={240}
          data={query.data.filter((t) => t.sprintTaskId).map((t) => ({ value: String(t.sprintTaskId), label: t.name }))}
          value={taskId}
          onChange={setTaskId}
          disabled={disabled}
        />
        <TextInput
          label="Pull request or issue URL"
          placeholder="https://github.com/org/repo/pull/12"
          style={{ flex: 1, minWidth: 240 }}
          value={url}
          onChange={(event) => setUrl(event.currentTarget.value)}
          disabled={disabled}
        />
        <Button leftSection={<IconLink size={16} />} disabled={disabled || !taskId || !url} loading={add.isPending} onClick={() => add.mutate({ sprintTaskId: Number(taskId), url })}>
          Link
        </Button>
      </Group>

      <Table.ScrollContainer minWidth={560}>
        <Table striped withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Task</Table.Th>
              <Table.Th>State</Table.Th>
              <Table.Th>Linked work</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {query.data.map((task) => (
              <Table.Tr key={task.key}>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {task.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {task.member ?? "Unassigned"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{task.state}</Text>
                </Table.Td>
                <Table.Td>
                  <Stack gap={4}>
                    {task.links.length === 0 && <Text size="xs" c="dimmed">None</Text>}
                    {task.links.map((link) => (
                      <Group key={link.url} gap={6} wrap="nowrap">
                        {link.provider === "jira" ? <SiJira size={14} aria-hidden /> : <IconBrandGithub size={14} aria-hidden />}
                        <Anchor href={link.url} target="_blank" rel="noreferrer" size="sm">
                          {link.externalId}
                        </Anchor>
                        <Badge size="xs" variant="light" color={STATUS_COLOR[link.status]}>
                          {LINK_STATUS_LABEL[link.status]}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          {ago(link.lastEventAt)}
                        </Text>
                        <Tooltip label="Remove link">
                          <ActionIcon size="sm" variant="subtle" color="red" aria-label={`Remove link ${link.externalId}`} disabled={disabled} onClick={() => remove.mutate({ id: link.id })}>
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    ))}
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <Stack gap={4}>
        <Text fw={600} size="sm">
          Live sync
        </Text>
        <Hint>
          GitHub webhook: <Code>{origin}/api/webhooks/github</Code>{" "}
          <Badge size="xs" variant="light" color={integrations.data?.githubWebhooks ? "green" : "gray"}>
            {integrations.data?.githubWebhooks ? "on" : "off: set GITHUB_WEBHOOK_SECRET"}
          </Badge>
        </Hint>
        <Hint>
          Jira webhook: <Code>{origin}/api/webhooks/jira</Code>{" "}
          <Badge size="xs" variant="light" color={integrations.data?.jiraWebhooks ? "green" : "gray"}>
            {integrations.data?.jiraWebhooks ? "on" : "off: set JIRA_WEBHOOK_SECRET"}
          </Badge>
        </Hint>
        <Hint>
          A merged PR completes its task, a review request moves it to QA, and an open PR with no activity for a few days marks the task at
          risk. PRs that mention a task&apos;s Jira key (PAY-104) in the title or branch link themselves.
        </Hint>
      </Stack>
    </Stack>
  );
};
