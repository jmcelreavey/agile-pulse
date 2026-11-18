'use client';

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Stack,
  Tabs,
  Text,
  Timeline,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconDownload,
  IconEdit,
  IconEye,
  IconFile,
  IconMail,
  IconShare,
  IconUser,
} from "@tabler/icons-react";
import { useState } from "react";
import { useChangelogDetails } from "~/app/hooks/useChangelogDetails";

interface ChangelogDetailsModalProps {
  changelogId: number | null;
  opened: boolean;
  onClose: () => void;
  onEdit?: (changelogId: number) => void;
}

export function ChangelogDetailsModal({
  changelogId,
  opened,
  onClose,
  onEdit,
}: ChangelogDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<string | null>("content");

  const {
    changelog,
    sharingHistory,
    isLoading,
    formatDate,
    getStatusBadge,
    getMethodIcon,
  } = useChangelogDetails({
    changelogId,
    enabled: opened,
  });

  const handleTabChange = (value: string | null) => {
    setActiveTab(value);
  };

  const getStatusBadgeComponent = (status: string) => {
    const { color, status: statusText } = getStatusBadge(status);
    return <Badge color={color}>{statusText}</Badge>;
  };

  const getMethodIconComponent = (method: string) => {
    const iconType = getMethodIcon(method);
    switch (iconType) {
      case "mail":
        return <IconMail size={16} />;
      case "file":
        return <IconFile size={16} />;
      default:
        return <IconShare size={16} />;
    }
  };

  if (!changelogId) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconEye size={20} />
          <Text fw={500}>Changelog Details</Text>
        </Group>
      }
      size="xl"
      centered
    >
      {isLoading ? (
        <Text>Loading changelog details...</Text>
      ) : !changelog ? (
        <Alert color="red">Changelog not found</Alert>
      ) : (
        <Stack gap="md">
          {/* Header Info */}
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <Stack gap="xs">
                <Group gap="xs">
                  <Title order={3}>{changelog.sprint.reference}</Title>
                  <Badge variant="outline">v{changelog.version}</Badge>
                  <Badge color={changelog.isPublished ? "green" : "gray"}>
                    {changelog.isPublished ? "Published" : "Draft"}
                  </Badge>
                </Group>
                <Text size="sm" c="dimmed">
                  {changelog.sprint.project.name}
                </Text>
              </Stack>

              <Group gap="xs">
                {onEdit && (
                  <Tooltip label="Edit Changelog">
                    <ActionIcon
                      variant="light"
                      color="orange"
                      onClick={() => onEdit(changelog.id)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}

                <Tooltip label="Export PDF">
                  <ActionIcon variant="light" color="purple">
                    <IconDownload size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>

            <Group gap="md">
              <Text size="sm">
                <strong>Created:</strong> {formatDate(changelog.createdAt)}
              </Text>
              <Text size="sm">
                <strong>Updated:</strong> {formatDate(changelog.updatedAt)}
              </Text>
              <Text size="sm">
                <strong>Creator:</strong> {changelog.creator?.name || "Unknown"}
              </Text>
              <Text size="sm">
                <strong>Tone:</strong> {changelog.tone}
              </Text>
            </Group>

            {changelog.sharedAt && (
              <Text size="sm" mt="xs">
                <strong>Shared:</strong> {formatDate(changelog.sharedAt)}
              </Text>
            )}
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tabs.List>
              <Tabs.Tab value="content" leftSection={<IconEye size={16} />}>
                Content
              </Tabs.Tab>
              <Tabs.Tab
                value="sharing"
                leftSection={<IconShare size={16} />}
                rightSection={
                  sharingHistory?.length ? (
                    <Badge size="xs" color="blue">
                      {sharingHistory.length}
                    </Badge>
                  ) : null
                }
              >
                Sharing History
              </Tabs.Tab>
              <Tabs.Tab value="tasks" leftSection={<IconUser size={16} />}>
                Tasks
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="content" pt="md">
              <Card withBorder>
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {changelog.content}
                </Text>
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="sharing" pt="md">
              {!sharingHistory?.length ? (
                <Alert>This changelog has not been shared yet.</Alert>
              ) : (
                <Timeline>
                  {sharingHistory.map((share) => (
                    <Timeline.Item
                      key={share.id}
                      bullet={getMethodIconComponent(share.method)}
                      title={
                        <Group gap="xs">
                          <Text fw={500}>
                            {share.method === "email"
                              ? "Email sent"
                              : "PDF exported"}
                          </Text>
                          {getStatusBadgeComponent(share.status)}
                        </Group>
                      }
                    >
                      <Text size="sm" c="dimmed" mb="xs">
                        {formatDate(share.createdAt)}
                      </Text>

                      {share.recipientEmail && (
                        <Text size="sm">
                          <strong>To:</strong> {share.recipientName} (
                          {share.recipientEmail})
                        </Text>
                      )}

                      <Text size="sm">
                        <strong>Shared by:</strong> {share.sharedByUser.name}
                      </Text>

                      {share.errorMessage && (
                        <Alert color="red" mt="xs">
                          <strong>Error:</strong> {share.errorMessage}
                        </Alert>
                      )}
                    </Timeline.Item>
                  ))}
                </Timeline>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="tasks" pt="md">
              {changelog.taskIds ? (
                <Card withBorder>
                  <Text size="sm">
                    <strong>Included Tasks:</strong>
                  </Text>
                  <Text size="sm" mt="xs">
                    Task IDs:{" "}
                    {(JSON.parse(changelog.taskIds) as number[]).join(", ")}
                  </Text>
                </Card>
              ) : (
                <Alert>No task information available for this changelog.</Alert>
              )}
            </Tabs.Panel>
          </Tabs>

          {/* Action Buttons */}
          <Group justify="flex-end">
            <Button variant="light" onClick={onClose}>
              Close
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
