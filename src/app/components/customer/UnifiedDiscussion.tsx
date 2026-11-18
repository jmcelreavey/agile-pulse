"use client";

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconTrash } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useDeleteCustomerComment } from "~/hooks/useCustomerComments";
import { useDeleteDeveloperComment } from "~/hooks/useDeveloperComments";
import { useDiscussionComments } from "~/hooks/useDiscussionComments";

interface UnifiedDiscussionProps {
  projectId?: string;
  sprintId?: string;
}

export function UnifiedDiscussion({
  projectId,
  sprintId,
}: UnifiedDiscussionProps) {
  const { data: session } = useSession();
  const { data: comments, isLoading } = useDiscussionComments({
    projectId,
    sprintId,
  });

  const deleteCustomerCommentMutation = useDeleteCustomerComment();
  const deleteDeveloperCommentMutation = useDeleteDeveloperComment();

  const handleDeleteCustomerComment = async (commentId: number) => {
    if (!projectId && !sprintId) return;

    try {
      await deleteCustomerCommentMutation.mutateAsync({
        commentId,
        projectId: projectId ? parseInt(projectId) : 0,
        sprintId: sprintId ? parseInt(sprintId) : undefined,
      });
      notifications.show({
        title: "Success",
        message: "Comment deleted successfully",
        color: "green",
      });
    } catch (error) {
      console.error("Error deleting customer comment:", error);
      notifications.show({
        title: "Error",
        message: "Failed to delete comment",
        color: "red",
      });
    }
  };

  const handleDeleteDeveloperComment = async (commentId: number) => {
    if (!projectId && !sprintId) return;

    try {
      await deleteDeveloperCommentMutation.mutateAsync({
        commentId,
        projectId: projectId ? parseInt(projectId) : 0,
        sprintId: sprintId ? parseInt(sprintId) : undefined,
      });
      notifications.show({
        title: "Success",
        message: "Comment deleted successfully",
        color: "green",
      });
    } catch (error) {
      console.error("Error deleting developer comment:", error);
      notifications.show({
        title: "Error",
        message: "Failed to delete comment",
        color: "red",
      });
    }
  };

  const canDeleteComment = (
    commentType: "customer" | "developer",
    authorId: number
  ) => {
    if (!session?.user?.id) return false;

    // Developers (users with "user" role) can delete any comment
    if (session.user.role === "user") return true;

    // Customers can only delete their own customer comments
    if (
      session.user.role === "customer" &&
      commentType === "customer" &&
      session.user.id === authorId
    ) {
      return true;
    }

    return false;
  };

  if (isLoading) {
    return (
      <Box p="md">
        <Text c="dimmed">Loading discussion...</Text>
      </Box>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <Box p="md">
        <Text c="dimmed">No comments yet. Start the discussion!</Text>
      </Box>
    );
  }

  return (
    <Stack gap="md">
      {comments.map((comment) => (
        <Box
          key={`${comment.type}-${comment.id}`}
          p="md"
          style={(theme) => ({
            backgroundColor:
              "light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))",
            borderRadius: theme.radius.md,
            border:
              "1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-4))",
          })}
        >
          <Group justify="space-between" align="flex-start">
            <Group gap="sm" align="flex-start">
              <Avatar size="sm" alt={comment.author.name ?? "User"}>
                {comment.author.name?.charAt(0)?.toUpperCase()}
              </Avatar>

              <Stack gap={4} style={{ flex: 1 }}>
                <Group gap="xs" align="center">
                  <Text size="sm" fw={500}>
                    {comment.author.name}
                  </Text>

                  <Badge
                    size="xs"
                    variant="light"
                    color={comment.type === "customer" ? "blue" : "green"}
                  >
                    {comment.type === "customer" ? "Customer" : "Developer"}
                  </Badge>

                  {comment.type === "customer" &&
                    comment.author.companyName &&
                    comment.author.companyName !== "NONE" &&
                    comment.author.companyName !== "None" && (
                      <Badge size="xs" variant="outline" color="gray">
                        {comment.author.companyName}
                      </Badge>
                    )}

                  {/* Only show sprint badge when viewing at project level (not when viewing specific sprint) */}
                  {comment.sprint && !sprintId && (
                    <Badge
                      size="xs"
                      variant="light"
                      color="blue"
                      component={Link}
                      href={`/projects/${projectId}/sprints/${comment.sprint.id}`}
                      style={{ cursor: "pointer", textDecoration: "none" }}
                    >
                      Sprint {comment.sprint.reference}
                    </Badge>
                  )}

                  <Text size="xs" c="dimmed">
                    {dayjs(comment.createdAt).format("MMM D, YYYY [at] h:mm A")}
                  </Text>
                </Group>

                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {comment.content}
                </Text>
              </Stack>
            </Group>

            {canDeleteComment(comment.type, comment.author.id) && (
              <Tooltip label="Delete comment">
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={() => {
                    if (comment.type === "customer") {
                      void handleDeleteCustomerComment(comment.id);
                    } else {
                      void handleDeleteDeveloperComment(comment.id);
                    }
                  }}
                  loading={
                    deleteCustomerCommentMutation.isPending ||
                    deleteDeveloperCommentMutation.isPending
                  }
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Box>
      ))}
    </Stack>
  );
}
