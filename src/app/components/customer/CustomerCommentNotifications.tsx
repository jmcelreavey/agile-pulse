"use client";

import { Badge, Group, Indicator, Text } from "@mantine/core";
import { IconMessageCircle } from "@tabler/icons-react";
import { useProjectCommentQueries } from "~/app/hooks/useCustomerCommentQueries";

interface CustomerCommentNotificationsProps {
  projectId: number;
  sprintId?: number;
  showCount?: boolean;
  variant?: "badge" | "indicator" | "text";
}

export function CustomerCommentNotifications({
  projectId,
  sprintId,
  showCount = false,
  variant = "badge",
}: CustomerCommentNotificationsProps) {
  const { comments, isLoading } = useProjectCommentQueries({ projectId, sprintId });

  if (isLoading || comments.length === 0) {
    return null;
  }

  // Check for recent comments (within last 7 days)
  const recentComments = comments.filter((comment) => {
    const commentDate = new Date(comment.createdAt);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return commentDate > sevenDaysAgo;
  });

  const hasRecentComments = recentComments.length > 0;

  if (variant === "badge") {
    return (
      <Badge
        variant={hasRecentComments ? "filled" : "light"}
        color={hasRecentComments ? "orange" : "blue"}
        size="sm"
        leftSection={<IconMessageCircle size={12} />}
      >
        {showCount ? `${comments.length} comment${comments.length !== 1 ? 's' : ''}` : 'Customer Feedback'}
      </Badge>
    );
  }

  if (variant === "indicator") {
    return (
      <Indicator
        color="orange"
        disabled={!hasRecentComments}
        size={8}
        offset={2}
      >
        <IconMessageCircle size={16} />
      </Indicator>
    );
  }

  if (variant === "text") {
    return (
      <Group gap="xs" c={hasRecentComments ? "orange" : "dimmed"}>
        <IconMessageCircle size={14} />
        <Text size="sm" fw={hasRecentComments ? 500 : 400}>
          {comments.length} customer comment{comments.length !== 1 ? 's' : ''}
          {hasRecentComments && ` (${recentComments.length} recent)`}
        </Text>
      </Group>
    );
  }

  return null;
}
