"use client";

import { Badge, Group, Paper, SimpleGrid, Skeleton, Stack, Text } from "@mantine/core";
import { CopyTextButton, Hint, Row } from "~/app/components/insights/shared";
import { type RetroCategory, type RetroPrompt } from "~/shared/logic/insights/retro";
import { api } from "~/trpc/react";

const CATEGORY: Record<RetroCategory, { label: string; color: string }> = {
  slip: { label: "Slip", color: "orange" },
  qa: { label: "QA", color: "violet" },
  blocker: { label: "Blocker", color: "red" },
  scope: { label: "Scope", color: "blue" },
  handoff: { label: "Handover", color: "cyan" },
  win: { label: "Win", color: "green" },
};

const Prompt = ({ prompt }: { prompt: RetroPrompt }) => (
  <Paper withBorder p="sm">
    <Group gap="xs" mb={4}>
      <Badge size="xs" variant="light" color={CATEGORY[prompt.category].color}>
        {CATEGORY[prompt.category].label}
      </Badge>
      <Text size="sm">{prompt.evidence}</Text>
    </Group>
    <Text size="sm" fw={600}>
      {prompt.question}
    </Text>
  </Paper>
);

export const RetroPanel = ({ sprintId }: { sprintId: number }) => {
  const query = api.insights.retro.useQuery({ sprintId });
  if (query.isLoading || !query.data) return <Skeleton h={240} />;
  const { retro } = query.data;
  const markdown = [
    "## To discuss",
    ...retro.toDiscuss.map((p) => `- ${p.evidence} ${p.question}`),
    "",
    "## Went well",
    ...retro.wentWell.map((p) => `- ${p.evidence} ${p.question}`),
  ].join("\n");

  return (
    <Stack gap="lg">
      <Row>
        <Group gap="xs">
          <Badge variant="light">{retro.stats.completed} of {retro.stats.tasks} tasks done</Badge>
          <Badge variant="light" color="orange">{retro.stats.slipped} slipped</Badge>
          <Badge variant="light" color="violet">{retro.stats.qaBounces} QA bounces</Badge>
          <Badge variant="light" color="red">{retro.stats.blockedDays} blocked days</Badge>
          <Badge variant="light" color="blue">{retro.stats.scopeAddedDays}d added</Badge>
        </Group>
        <CopyTextButton value={markdown} label="Copy as markdown" />
      </Row>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Stack gap="xs">
          <Text fw={600}>To discuss</Text>
          {retro.toDiscuss.length ? retro.toDiscuss.map((p, i) => <Prompt key={i} prompt={p} />) : <Hint>The replay shows nothing unusual.</Hint>}
        </Stack>
        <Stack gap="xs">
          <Text fw={600}>Went well</Text>
          {retro.wentWell.length ? retro.wentWell.map((p, i) => <Prompt key={i} prompt={p} />) : <Hint>No task finished on or ahead of plan yet.</Hint>}
        </Stack>
      </SimpleGrid>
      <Hint>Generated from the snapshot replay, biggest problems first. Each prompt quotes what happened, then asks a question.</Hint>
    </Stack>
  );
};
