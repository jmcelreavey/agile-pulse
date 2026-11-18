"use client";

import {
  ActionIcon,
  Badge,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip
} from "@mantine/core";
import { IconEye } from "@tabler/icons-react";
import { useState } from "react";
import ReadOnlyRichTextEditor from "~/app/components/base/rich-text-editor/ReadOnlyRichTextEditor";
import { useChangelogsList } from "~/hooks/useChangelogsList";

interface PublishedChangelogsSectionProps {
  sprintId: number;
  projectId: number;
  sprintName: string;
}

interface ChangelogData {
  id: number;
  content: string;
  tone: string;
  createdAt: Date;
  updatedAt: Date;
  sprintId: number;
  isPublished: boolean;
  taskIds: string | null;
  _count: {
    sharingHistory: number;
  };
  sprint: {
    project: {
      name: string;
      id: number;
    };
  };
  creator: {
    id: number;
    name: string | null;
    email: string | null;
  } | null;
}

export const PublishedChangelogsSection = ({
  sprintId,
  projectId,
  sprintName,
}: PublishedChangelogsSectionProps) => {
  const { changelogs, isLoading } = useChangelogsList(sprintId, projectId);
  const [viewingChangelog, setViewingChangelog] = useState<ChangelogData | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Filter to only show published changelogs
  const publishedChangelogs = changelogs.filter((changelog: ChangelogData) => changelog.isPublished);

  const handleViewChangelog = (changelog: ChangelogData) => {
    setViewingChangelog(changelog);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingChangelog(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <Text>Loading changelogs...</Text>;
  }

  if (publishedChangelogs.length === 0) {
    return null; // Don't show section if no published changelogs
  }

  return (
    <>
      <Stack gap="md">
        <Title order={3}>Published Sprint Updates</Title>
        <Text size="sm" c="dimmed">
          Official changelog updates shared with customers for {sprintName}
        </Text>
        
        <Stack gap="sm">
          {publishedChangelogs.map((changelog: ChangelogData) => (
            <Paper key={changelog.id} p="md" withBorder>
              <Group justify="space-between" align="flex-start">
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Group gap="sm">
                    <Badge color="green" size="sm">
                      Published
                    </Badge>
                    <Text size="sm" c="dimmed">
                      {formatDate(changelog.createdAt.toISOString())}
                    </Text>
                    {changelog.taskIds && (
                      <Text size="sm" c="dimmed">
                        {(JSON.parse(changelog.taskIds) as number[]).length} tasks
                      </Text>
                    )}
                  </Group>
                </Stack>
                
                <Group gap="xs">
                  <Tooltip label="View Changelog">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => handleViewChangelog(changelog)}
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      </Stack>

      {/* View Modal */}
      <Modal
        opened={isViewModalOpen}
        onClose={handleCloseViewModal}
        title={
          <Group>
            <IconEye size={20} />
            <Text fw={500}>Sprint Changelog</Text>
            {viewingChangelog && (
              <Badge color="green" size="sm">
                Published
              </Badge>
            )}
          </Group>
        }
        size="xl"
        centered
      >
        {viewingChangelog && (
          <Stack gap="md">
            <Group gap="sm">
              <Text size="sm" c="dimmed">
                Created: {formatDate(viewingChangelog.createdAt.toISOString())}
              </Text>
              {viewingChangelog.taskIds && (
                <>
                  <Text size="sm" c="dimmed">•</Text>
                  <Text size="sm" c="dimmed">
                    {(JSON.parse(viewingChangelog.taskIds) as number[]).length} tasks included
                  </Text>
                </>
              )}
            </Group>
            
            <ReadOnlyRichTextEditor
              content={viewingChangelog.content}
              withBorder
              shadow="sm"
            />
          </Stack>
        )}
      </Modal>
    </>
  );
};
