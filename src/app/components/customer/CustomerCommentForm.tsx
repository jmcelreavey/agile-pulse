import { Box, Button, Group, Text, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { CustomerCommentUseCase } from "~/app/logic/customer/CustomerCommentUseCase";

interface CustomerCommentFormProps {
  projectId?: string;
  sprintId?: string;
  onCommentCreated?: () => void;
}

interface CommentFormData {
  content: string;
}

export function CustomerCommentForm({
  projectId,
  sprintId,
  onCommentCreated,
}: CustomerCommentFormProps) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    if (!session?.user?.id) {
      notifications.show({
        title: "Error",
        message: "You must be logged in to comment",
        color: "red",
      });
      return;
    }

    if (!projectId && !sprintId) {
      notifications.show({
        title: "Error",
        message: "Project or Sprint context is required",
        color: "red",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await customerComment.createCommentAction({
        projectId: projectId ? parseInt(projectId) : 0,
        sprintId: sprintId ? parseInt(sprintId) : undefined,
        content: values.content.trim(),
      });
      form.reset();
      onCommentCreated?.();
      
      notifications.show({
        title: "Success",
        message: "Comment added successfully",
        color: "green",
      });
    } catch (error) {
      console.error("Error submitting comment:", error);
      notifications.show({
        title: "Error",
        message: "Failed to add comment",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only show form to customers
  if (!session?.user || session.user.role !== "customer") {
    return null;
  }

  return (
    <Box
      component="form"
      onSubmit={form.onSubmit(handleSubmit)}
      p="md"
      style={(theme) => ({
        backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
        borderRadius: theme.radius.md,
        border: '1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-4))',
      })}
    >
      <Text size="sm" fw={500} mb="xs">
        Add Customer Comment
      </Text>
      
      <Textarea
        {...form.getInputProps("content")}
        placeholder="Share your thoughts, questions, or feedback..."
        minRows={3}
        maxRows={6}
        autosize
        disabled={isSubmitting}
        mb="sm"
      />
      
      <Group justify="space-between">
        <Text size="xs" c="dimmed">
          {form.values.content.length}/2000 characters
        </Text>
        <Button
          type="submit"
          size="sm"
          disabled={!form.values.content.trim() || isSubmitting}
          loading={isSubmitting}
        >
          Post Comment
        </Button>
      </Group>
    </Box>
  );
}
