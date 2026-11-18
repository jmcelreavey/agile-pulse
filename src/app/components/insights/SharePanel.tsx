"use client";

import { ActionIcon, Anchor, Button, Group, Skeleton, Stack, Table, Text, Tooltip } from "@mantine/core";
import { IconCalendarPlus, IconShare, IconTrash } from "@tabler/icons-react";
import { CopyTextButton, Hint } from "~/app/components/insights/shared";
import { api } from "~/trpc/react";

export const SharePanel = ({ sprintId }: { sprintId: number }) => {
  const utils = api.useUtils();
  const query = api.insights.shareLinks.useQuery({ sprintId });
  const create = api.insights.createShareLink.useMutation({ onSuccess: () => void utils.insights.shareLinks.invalidate() });
  const revoke = api.insights.revokeShareLink.useMutation({ onSuccess: () => void utils.insights.shareLinks.invalidate() });
  if (query.isLoading || !query.data) return <Skeleton h={120} />;
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  return (
    <Stack gap="lg">
      <Group>
        <Button leftSection={<IconShare size={16} />} loading={create.isPending} onClick={() => create.mutate({ sprintId })}>
          Create a public link
        </Button>
      </Group>
      {query.data.length === 0 ? (
        <Hint>No public links yet.</Hint>
      ) : (
        <Table.ScrollContainer minWidth={560}>
          <Table withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Read-only chart</Table.Th>
                <Table.Th>Deadline calendar (iCal)</Table.Th>
                <Table.Th w={60} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {query.data.map((link) => {
                const shareUrl = `${origin}/share/${link.token}`;
                const icsUrl = `${origin}/api/calendar/${link.token}.ics`;
                return (
                  <Table.Tr key={link.id}>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        <Anchor href={shareUrl} target="_blank" size="sm">
                          /share/{link.token}
                        </Anchor>
                        <CopyTextButton value={shareUrl} />
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        <Anchor href={icsUrl.replace(/^https?:/, "webcal:")} size="sm">
                          <IconCalendarPlus size={14} /> Subscribe
                        </Anchor>
                        <CopyTextButton value={icsUrl} />
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label="Revoke">
                        <ActionIcon variant="subtle" color="red" aria-label="Revoke link" onClick={() => revoke.mutate({ id: link.id })}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
      <Text size="sm" c="dimmed">
        Anyone with the link sees this sprint&apos;s chart, forecast and deadlines, read-only, and can subscribe to the project&apos;s
        deadlines in Google Calendar, Outlook or Apple Calendar. Revoking a link turns both off at once.
      </Text>
    </Stack>
  );
};
