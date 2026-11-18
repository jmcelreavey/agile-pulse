"use client";

import { Badge, Button, Group, List, SimpleGrid, Skeleton, Stack, Text, Tooltip } from "@mantine/core";
import { IconSend } from "@tabler/icons-react";
import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { CopyTextButton, Hint, Row } from "~/app/components/insights/shared";
import { standupToText } from "~/shared/logic/insights/standup";
import { api } from "~/trpc/react";

export const StandupPanel = ({ sprintId }: { sprintId: number }) => {
  const query = api.insights.standup.useQuery({ sprintId });
  const integrations = api.insights.integrations.useQuery();
  const send = api.insights.sendStandup.useMutation({
    onSuccess: (result) =>
      ShowNotificationUtil({ title: "Standup digest", message: `Slack: ${result.slack}. Email: ${result.email}.`, autoClose: 4000 }),
    onError: (error) => ShowNotificationUtil({ message: error.message, isError: true }),
  });
  if (query.isLoading || !query.data) return <Skeleton h={240} />;
  const { standup, sprint } = query.data;
  const canSend = Boolean(integrations.data?.slackDigest || integrations.data?.emailDigest);
  const text = standupToText(standup, `${sprint.projectName}, Sprint ${sprint.reference}`);
  const changes = [...standup.completed, ...standup.moves];

  return (
    <Stack gap="lg">
      <Row>
        <Text fw={600}>
          Day {standup.day} of {standup.sprintDays}
          {standup.sinceDay !== null ? `, changes since day ${standup.sinceDay}` : ""}
        </Text>
        <Group gap="xs">
          <CopyTextButton value={text} label="Copy for Slack" />
          <Tooltip label={canSend ? "Send to the configured Slack webhook and email list" : "Set SLACK_WEBHOOK_URL, or RESEND_API_KEY and DIGEST_EMAIL_TO, to send"}>
            <Button size="xs" leftSection={<IconSend size={14} />} disabled={!canSend} loading={send.isPending} onClick={() => send.mutate({ sprintId })}>
              Send now
            </Button>
          </Tooltip>
        </Group>
      </Row>
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        <div>
          <Text fw={600} mb="xs">
            Since yesterday
          </Text>
          {changes.length + standup.added.length + standup.reassigned.length === 0 ? (
            <Hint>No changes.</Hint>
          ) : (
            <List size="sm" spacing={4}>
              {changes.map((move) => (
                <List.Item key={`${move.task}-${move.to}`}>
                  <b>{move.task}</b> {move.from ?? "new"} → {move.to}
                  {move.member ? ` (${move.member})` : ""}
                </List.Item>
              ))}
              {standup.added.map((item) => (
                <List.Item key={`added-${item.task}`}>
                  Added <b>{item.task}</b> ({item.days}d{item.member ? `, ${item.member}` : ""})
                </List.Item>
              ))}
              {standup.reassigned.map((item) => (
                <List.Item key={`moved-${item.task}`}>
                  <b>{item.task}</b> moved from {item.from ?? "unassigned"} to {item.to ?? "unassigned"}
                </List.Item>
              ))}
            </List>
          )}
        </div>
        <div>
          <Text fw={600} mb="xs">
            Today
          </Text>
          <List size="sm" spacing={4}>
            {standup.today.map((person) => (
              <List.Item key={person.member}>
                <b>{person.member}</b>:{" "}
                {person.away ? (
                  <Badge size="xs" variant="light">
                    away
                  </Badge>
                ) : (
                  <>
                    {person.focus ?? "nothing open"}
                    {person.state ? ` (${person.state})` : ""}
                    {person.next ? `, then ${person.next}` : ""}
                  </>
                )}
              </List.Item>
            ))}
          </List>
        </div>
        <div>
          <Text fw={600} mb="xs">
            Blockers and risks
          </Text>
          {standup.blockers.length === 0 ? (
            <Hint>None.</Hint>
          ) : (
            <List size="sm" spacing={4}>
              {standup.blockers.map((blocker) => (
                <List.Item key={blocker.task}>
                  <b>{blocker.task}</b>
                  {blocker.member ? ` (${blocker.member})` : ""}: {blocker.reason}
                </List.Item>
              ))}
            </List>
          )}
        </div>
      </SimpleGrid>
      <Hint>
        Compares today&apos;s chart with the last snapshot. On weekdays at 08:00 UTC the Worker sends this to Slack and email when they
        are configured.
      </Hint>
    </Stack>
  );
};
