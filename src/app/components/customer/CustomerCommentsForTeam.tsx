"use client";

import { Alert, Badge, Card, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { IconAlertCircle, IconMessageCircle } from "@tabler/icons-react";
import Link from "next/link";
import { useProjectCommentQueries } from "~/app/hooks/useCustomerCommentQueries";

interface CustomerCommentsForTeamProps {
  projectId: number;
  projectName: string;
  sprintId?: number;
  sprintReference?: string;
}

export function CustomerCommentsForTeam({
  projectId,
  projectName,
  sprintId,
  sprintReference,
}: CustomerCommentsForTeamProps) {
  const { comments, isLoading } = useProjectCommentQueries({ projectId, sprintId });

  if (isLoading) {
    return (
      <Paper withBorder mt="xl" p="lg">
        <Group gap="sm" mb="sm">
          <IconMessageCircle size={18} />
          <Title order={3}>Customer Feedback</Title>
        </Group>
        <Text c="dimmed">Loading customer comments...</Text>
      </Paper>
    );
  }

  return (
    <Paper withBorder mt="xl" p="lg">
      {/* Header Section */}
      <Group gap="sm" mb="md">
        <IconMessageCircle size={18} />
        <Title order={3}>Customer Feedback</Title>
        <Badge variant="light" color="blue" size="sm">
          {comments.length}
        </Badge>
      </Group>

      {/* Description */}
      <Text size="sm" c="dimmed" mb="lg">
        Comments and feedback from customers on{" "}
        {sprintId 
          ? `${sprintReference ? `Sprint ${sprintReference}` : "this sprint"} in ${projectName}` 
          : projectName
        }.
      </Text>

      {/* Comments List */}
      <Stack gap="md">
        {comments.length === 0 ? (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="blue"
            variant="light"
          >
            No customer comments yet. When customers share feedback, it will appear here.
          </Alert>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} withBorder p="md">
              <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                  <Group gap="sm">
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
                  </Group>
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
                
                <Group justify="space-between" align="center">
                  <Text size="xs" c="dimmed">
                    From: {comment.customer.email}
                  </Text>
                  <Group gap="xs">
                    {comment.sprint && (
                      <Badge 
                        variant="light" 
                        color="blue" 
                        size="xs"
                        component={Link}
                        href={`/projects/${projectId}/sprints/${comment.sprint.id}`}
                        style={{ cursor: 'pointer', textDecoration: 'none' }}
                      >
                        Sprint {comment.sprint.reference}
                      </Badge>
                    )}
                    {!comment.sprint && (
                      <Badge variant="light" color="gray" size="xs">
                        Project Level
                      </Badge>
                    )}
                  </Group>
                </Group>
              </Stack>
            </Card>
          ))
        )}
      </Stack>
    </Paper>
  );
}
