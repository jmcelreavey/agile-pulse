"use client";

import { Alert, Badge, Button, Group, Paper, SimpleGrid, Skeleton, Stack, Text, Textarea, Typography } from "@mantine/core";
import { IconMessageShare } from "@tabler/icons-react";
import { useState } from "react";
import { CopyTextButton, Hint, Row, SourceBadge } from "~/app/components/insights/shared";
import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { api } from "~/trpc/react";
import { markdownToHtml } from "~/utils/markdown-converter";

const CONFIDENCE_COLOR = { high: "green", medium: "yellow", low: "red" } as const;

export const CustomerUpdatePanel = ({ sprintId, disabled }: { sprintId: number; disabled?: boolean }) => {
  const query = api.insights.weeklyUpdate.useQuery({ sprintId });
  const utils = api.useUtils();
  const [draft, setDraft] = useState<string | null>(null);
  const post = api.insights.postWeeklyUpdate.useMutation({
    onSuccess: () => {
      ShowNotificationUtil({ title: "Posted", message: "The update is in the sprint discussion your customers can see.", autoClose: 4000 });
      void utils.customer.getDiscussionComments.invalidate();
    },
    onError: (error) => ShowNotificationUtil({ message: error.message, isError: true }),
  });
  if (query.isLoading || !query.data) return <Skeleton h={240} />;
  const markdown = draft ?? query.data.markdown;

  return (
    <Stack gap="lg">
      <Row>
        <Group gap="xs">
          <Text fw={600}>Weekly update draft</Text>
          <SourceBadge source={query.data.source} />
        </Group>
        <Badge color={CONFIDENCE_COLOR[query.data.eta.confidence]} variant="light">
          ETA confidence: {query.data.eta.confidence}
        </Badge>
      </Row>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Textarea
          aria-label="Weekly update (markdown)"
          autosize
          minRows={12}
          value={markdown}
          onChange={(event) => setDraft(event.currentTarget.value)}
          disabled={disabled}
        />
        <Paper withBorder p="md">
          <Text size="xs" c="dimmed" mb="xs">
            Preview
          </Text>
          <Typography>
            <div dangerouslySetInnerHTML={{ __html: markdownToHtml(markdown.replace(/</g, "&lt;")) }} />
          </Typography>
        </Paper>
      </SimpleGrid>
      <Group gap="xs">
        <Button leftSection={<IconMessageShare size={16} />} loading={post.isPending} disabled={disabled} onClick={() => post.mutate({ sprintId, markdown })}>
          Post to customer discussion
        </Button>
        <CopyTextButton value={markdown} label="Copy" />
        {draft !== null && (
          <Button variant="subtle" onClick={() => setDraft(null)}>
            Reset draft
          </Button>
        )}
      </Group>
      <Alert variant="light" color="gray">
        Customers on the portal see this sprint&apos;s ETA and the latest draft on their sprint page. It lists finished work by name only:
        no people, states or estimates.
      </Alert>
      <Hint>The ETA counts the forecast&apos;s remaining days forward from today in working days.</Hint>
    </Stack>
  );
};
