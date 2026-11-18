"use client";

import { Badge, Group, Paper, Skeleton, Text, Typography } from "@mantine/core";
import { IconCalendarDue } from "@tabler/icons-react";
import { api } from "~/trpc/react";
import { markdownToHtml } from "~/utils/markdown-converter";

const CONFIDENCE_COLOR = { high: "green", medium: "yellow", low: "red" } as const;

/** The customer's view of the forecast: an ETA and the team's drafted weekly update. */
export const CustomerOutlookCard = ({ projectId, sprintId }: { projectId: number; sprintId: number }) => {
  const query = api.insights.customerOutlook.useQuery({ projectId, sprintId });
  if (query.isLoading) return <Skeleton h={160} />;
  if (!query.data) return null;
  const { eta, markdown } = query.data;
  return (
    <Paper withBorder p="lg">
      <Group justify="space-between" mb="sm">
        <Group gap="xs">
          <IconCalendarDue size={20} aria-hidden />
          <Text fw={600}>Expected delivery</Text>
        </Group>
        <Badge variant="light" color={CONFIDENCE_COLOR[eta.confidence]}>
          {eta.confidence} confidence
        </Badge>
      </Group>
      <Text mb="md">{eta.text}</Text>
      <Typography>
        <div dangerouslySetInnerHTML={{ __html: markdownToHtml(markdown.replace(/</g, "&lt;")) }} />
      </Typography>
    </Paper>
  );
};
