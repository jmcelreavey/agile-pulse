'use client';

import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { IconEdit } from "@tabler/icons-react";
import { useChangelogEdit } from "~/app/hooks/useChangelogEdit";

interface ChangelogEditModalProps {
  changelogId: number | null;
  opened: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function ChangelogEditModal({
  changelogId,
  opened,
  onClose,
  onSaved,
}: ChangelogEditModalProps) {
  const {
    changelog,
    isLoading,
    content,
    setContent,
    tone,
    setTone,
    isPublished,
    setIsPublished,
    hasChanges,
    handleSave,
    handleClose,
    toneOptions,
    isSaving,
  } = useChangelogEdit({
    changelogId,
    enabled: opened,
    onSaved,
    onClose,
  });

  if (!changelogId) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group>
          <IconEdit size={20} />
          <Text fw={500}>Edit Changelog</Text>
        </Group>
      }
      size="xl"
      centered
    >
      {isLoading ? (
        <Text>Loading changelog...</Text>
      ) : !changelog ? (
        <Alert color="red">Changelog not found</Alert>
      ) : (
        <Stack gap="md">
          {/* Header Info */}
          <Group justify="space-between">
            <Stack gap="xs">
              <Group gap="xs">
                <Title order={4}>{changelog.sprint.reference}</Title>
                <Badge variant="outline">v{changelog.version}</Badge>
              </Group>
              <Text size="sm" c="dimmed">
                {changelog.sprint.project.name}
              </Text>
            </Stack>

            {hasChanges && <Badge color="orange">Unsaved Changes</Badge>}
          </Group>

          {/* Form Fields */}
          <Stack gap="md">
            <Select
              label="Tone"
              placeholder="Select changelog tone"
              data={toneOptions}
              value={tone}
              onChange={(value) => value && setTone(value)}
              required
            />

            <Textarea
              label="Content"
              placeholder="Enter changelog content..."
              value={content}
              onChange={(event) => setContent(event.target.value)}
              minRows={10}
              maxRows={20}
              autosize
              required
            />

            <Switch
              label="Published"
              description="Published changelogs are visible to customers"
              checked={isPublished}
              onChange={(event) => setIsPublished(event.currentTarget.checked)}
            />
          </Stack>

          {/* Actions */}
          <Group justify="space-between">
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Created: {new Date(changelog.createdAt).toLocaleDateString()}
              </Text>
              <Text size="sm" c="dimmed">
                •
              </Text>
              <Text size="sm" c="dimmed">
                Updated: {new Date(changelog.updatedAt).toLocaleDateString()}
              </Text>
            </Group>

            <Group>
              <Button variant="light" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                loading={isSaving}
                disabled={!hasChanges}
              >
                Save Changes
              </Button>
            </Group>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
