"use client";

import { ActionIcon, Alert, Button, Code, Group, Paper, Skeleton, Stack, Table, Text, TextInput, Title, Tooltip } from "@mantine/core";
import { IconKey, IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { CopyTextButton, Hint } from "~/app/components/insights/shared";
import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { api } from "~/trpc/react";

const when = (date: Date | null) => (date ? new Date(date).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Never");

export const SettingsView = () => {
  const utils = api.useUtils();
  const tokens = api.insights.apiTokens.useQuery();
  const [name, setName] = useState("My MCP client");
  const [created, setCreated] = useState<string | null>(null);
  const create = api.insights.createApiToken.useMutation({
    onSuccess: (data) => {
      setCreated(data.token);
      void utils.insights.apiTokens.invalidate();
    },
    onError: (error) => ShowNotificationUtil({ message: error.message, isError: true }),
  });
  const revoke = api.insights.revokeApiToken.useMutation({ onSuccess: () => void utils.insights.apiTokens.invalidate() });
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const endpoint = `${origin}/api/mcp`;
  const token = created ?? "ap_your_token";
  const claudeCode = `claude mcp add --transport http agile-pulse ${endpoint} --header "Authorization: Bearer ${token}"`;
  const json = JSON.stringify({ mcpServers: { "agile-pulse": { url: endpoint, headers: { Authorization: `Bearer ${token}` } } } }, null, 2);

  return (
    <Stack gap="xl" maw={900}>
      <div>
        <Title order={1} fz={{ base: 26, sm: 32 }}>
          API tokens &amp; MCP
        </Title>
        <Text c="dimmed">
          Connect an AI assistant (Claude, Cursor, ChatGPT or anything that speaks MCP) to your sprints. It can read forecasts and standups and
          move tasks, with the same rights as you.
        </Text>
      </div>

      <Paper withBorder p="lg">
        <Stack gap="md">
          <Group align="flex-end" gap="xs">
            <TextInput label="Token name" value={name} onChange={(event) => setName(event.currentTarget.value)} style={{ flex: 1, minWidth: 200 }} />
            <Button leftSection={<IconKey size={16} />} loading={create.isPending} disabled={!name.trim()} onClick={() => create.mutate({ name })}>
              Create token
            </Button>
          </Group>
          {created && (
            <Alert color="green" variant="light" title="Copy this token now">
              <Stack gap="xs">
                <Text size="sm">It is shown once. Agile Pulse only keeps a hash of it.</Text>
                <Group gap="xs">
                  <Code style={{ wordBreak: "break-all" }}>{created}</Code>
                  <CopyTextButton value={created} />
                </Group>
              </Stack>
            </Alert>
          )}
          {tokens.isLoading ? (
            <Skeleton h={80} />
          ) : tokens.data?.length ? (
            <Table.ScrollContainer minWidth={480}>
              <Table withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Token</Table.Th>
                    <Table.Th>Created</Table.Th>
                    <Table.Th>Last used</Table.Th>
                    <Table.Th w={50} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {tokens.data.map((t) => (
                    <Table.Tr key={t.id}>
                      <Table.Td>{t.name}</Table.Td>
                      <Table.Td>
                        <Code>{t.prefix}…</Code>
                      </Table.Td>
                      <Table.Td>{when(t.createdAt)}</Table.Td>
                      <Table.Td>{when(t.lastUsedAt)}</Table.Td>
                      <Table.Td>
                        <Tooltip label="Revoke">
                          <ActionIcon variant="subtle" color="red" aria-label={`Revoke ${t.name}`} onClick={() => revoke.mutate({ id: t.id })}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          ) : (
            <Hint>No tokens yet.</Hint>
          )}
        </Stack>
      </Paper>

      <Paper withBorder p="lg">
        <Stack gap="sm">
          <Title order={3}>Connect a client</Title>
          <Text size="sm">
            Endpoint: <Code>{endpoint}</Code> (Streamable HTTP, bearer token)
          </Text>
          <Text size="sm" fw={600}>
            Claude Code
          </Text>
          <Code block>{claudeCode}</Code>
          <Group>
            <CopyTextButton value={claudeCode} />
          </Group>
          <Text size="sm" fw={600}>
            Cursor, Claude Desktop and other JSON configs
          </Text>
          <Code block>{json}</Code>
          <Group>
            <CopyTextButton value={json} />
          </Group>
          <Hint>
            Tools: list_projects, list_sprints, get_sprint, get_forecast, list_at_risk_tasks, get_standup, update_task, move_task and add_task.
            See the <Link href="/docs/mcp">MCP docs</Link> for details. On the public demo, tokens are wiped by the nightly reset.
          </Hint>
        </Stack>
      </Paper>
    </Stack>
  );
};
