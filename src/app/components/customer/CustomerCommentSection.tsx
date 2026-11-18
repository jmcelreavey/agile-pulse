"use client";

import {
    ActionIcon,
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Group,
    Stack,
    Text,
    Textarea,
    Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
    IconAlertCircle,
    IconMessageCircle,
    IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";
import { useCustomerCommentQueries } from "~/app/hooks/useCustomerCommentQueries";
import { CustomerCommentUseCase } from "~/app/logic/customer/CustomerCommentUseCase";

interface CustomerCommentSectionProps {
  projectId: number;
  projectName: string;
  sprintId?: number;
  sprintReference?: string;
}

interface CommentFormData {
  content: string;
}

export function CustomerCommentSection({
  projectId,
  projectName,
  sprintId,
  sprintReference,
}: CustomerCommentSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { comments, isLoading } = useCustomerCommentQueries({ projectId, sprintId });
  const customerComment = new CustomerCommentUseCase();

  const form = useForm<CommentFormData>({
    initialValues: {
      content: "",
    },
    validate: {
      content: (value) =>
        value.trim().length === 0
          ? "Comment cannot be empty"
          : value.length > 2000
          ? "Comment cannot exceed 2000 characters"
          : null,
    },
  });

  const handleSubmit = async (values: CommentFormData) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await customerComment.createCommentAction({
        projectId,
        sprintId,
        content: values.content.trim(),
      });
      form.reset();
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await customerComment.deleteCommentAction({
        commentId,
        projectId,
        sprintId,
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card withBorder p="lg">
        <Group gap="sm" mb="sm">
          <IconMessageCircle size={18} />
          <Title order={3}>
            {sprintId ? `Sprint Communication` : "Project Communication"}
          </Title>
        </Group>
        <Text c="dimmed">Loading comments...</Text>
      </Card>
    );
  }

  return (
    <Stack gap="lg">
      <Group gap="sm">
        <IconMessageCircle size={18} />
        <Title order={3}>
          {sprintId ? `Sprint Communication` : "Project Communication"}
        </Title>
      </Group>

      <Text size="sm" c="dimmed">
        Share feedback, questions, or updates about{" "}
        {sprintId 
          ? `${sprintReference ? `Sprint ${sprintReference}` : "this sprint"} in ${projectName}` 
          : projectName
        }{" "}
        with the project team.
      </Text>

      {/* Comment Form */}
      <Card withBorder p="lg">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Textarea
              label="Add a comment"
              placeholder="Share your thoughts, questions, or feedback..."
              minRows={3}
              maxRows={6}
              {...form.getInputProps("content")}
              disabled={isSubmitting}
            />
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                {form.values.content.length}/2000 characters
              </Text>
              <Button
                type="submit"
                disabled={!form.values.content.trim() || isSubmitting}
                loading={isSubmitting}
              >
                Post Comment
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>

      {/* Comments List */}
      {comments.length === 0 ? (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="blue"
          variant="light"
        >
          No comments yet. Be the first to share your thoughts!
        </Alert>
      ) : (
        <Stack gap="md">
          <Text fw={500} size="sm">
            Your Comments ({comments.length})
          </Text>
          {comments.map((comment) => (
            <Card key={comment.id} withBorder p="md">
              <Group justify="space-between" align="flex-start">
                <Box style={{ flex: 1 }}>
                  <Group gap="sm" mb="xs">
                    <Text fw={500} size="sm">
                      {comment.customer.name}
                    </Text>
                    {comment.customer.companyName && 
                     comment.customer.companyName !== "NONE" && 
                     comment.customer.companyName !== "None" && (
                      <Badge variant="outline" size="xs">
                        {comment.customer.companyName}
                      </Badge>
                    )}
                    <Text size="xs" c="dimmed">
                      {new Date(comment.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </Group>
                  <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                    {comment.content}
                  </Text>
                  
                  {/* Show context if viewing all comments */}
                  {(!sprintId && comment.sprint) && (
                    <Group gap="xs" mt="xs">
                      <Badge variant="light" color="blue" size="xs">
                        Sprint {comment.sprint.reference}
                      </Badge>
                    </Group>
                  )}
                  {(!sprintId && !comment.sprint) && (
                    <Group gap="xs" mt="xs">
                      <Badge variant="light" color="gray" size="xs">
                        Project Level
                      </Badge>
                    </Group>
                  )}
                </Box>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={() => handleDelete(comment.id)}
                  disabled={isSubmitting}
                  title="Delete comment"
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
