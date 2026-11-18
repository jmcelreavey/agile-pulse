import { Box, Button, Group, Text, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useSession } from "next-auth/react";
import { useCreateDeveloperComment } from "~/hooks/useDeveloperComments";

interface DeveloperCommentFormProps {
  projectId?: string;
  sprintId?: string;
  onCommentCreated?: () => void;
}

export function DeveloperCommentForm({
  projectId,
  sprintId,
  onCommentCreated,
}: DeveloperCommentFormProps) {
  const { data: session } = useSession();
  const createCommentMutation = useCreateDeveloperComment();

  const form = useForm({
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

  const handleSubmit = async (values: { content: string }) => {
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

    const projectIdNum = projectId ? parseInt(projectId) : undefined;
    const sprintIdNum = sprintId ? parseInt(sprintId) : undefined;

    if (!projectIdNum) {
      notifications.show({
        title: "Error",
        message: "Valid Project ID is required",
        color: "red",
      });
      return;
    }

    try {
      await createCommentMutation.mutateAsync({
        content: values.content.trim(),
        projectId: projectIdNum,
        sprintId: sprintIdNum,
      });

      form.reset();
      onCommentCreated?.();
      
      notifications.show({
        title: "Success",
        message: "Comment added successfully",
        color: "green",
      });
    } catch (error) {
      console.error("Error submitting developer comment:", error);
      notifications.show({
        title: "Error",
        message: "Failed to add comment",
        color: "red",
      });
    }
  };

  // Only show form to developers/admins
  if (!session?.user || session.user.role !== "user") {
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
        Add Developer Comment
      </Text>
      
      <Textarea
        {...form.getInputProps("content")}
        placeholder="Share your thoughts, updates, or questions..."
        minRows={3}
        maxRows={6}
        autosize
        mb="sm"
      />
      
      <Group justify="space-between">
        <Text size="xs" c="dimmed">
          {form.values.content.length}/2000 characters
        </Text>
        <Button
          type="submit"
          size="sm"
          loading={createCommentMutation.isPending}
          disabled={!form.values.content.trim()}
        >
          Post Comment
        </Button>
      </Group>
    </Box>
  );
}
