'use client';

import {
  Card,
  Container,
  Group,
  Stack,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { IconHistory, IconList } from "@tabler/icons-react";
import { ChangelogDetailsModal } from "~/app/components/changelog/ChangelogDetailsModal";
import { ChangelogEditModal } from "~/app/components/changelog/ChangelogEditModal";
import { ChangelogManagement } from "~/app/components/changelog/ChangelogManagement";
import { useChangelogListView } from "~/app/hooks/useChangelogListView";

interface ChangelogListViewProps {
  projectId?: number;
}

export function ChangelogListView({ projectId }: ChangelogListViewProps) {
  const {
    activeTab,
    handleTabChange,
    selectedChangelogId,
    showDetailsModal,
    showEditModal,
    handleViewDetails,
    handleEdit,
    handleCloseModals,
  } = useChangelogListView({ projectId });

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <Stack gap="xs">
            <Title order={1}>Changelog Management</Title>
            <Text c="dimmed">
              Manage and track all sprint changelogs{" "}
              {projectId ? "for this project" : "across all projects"}
            </Text>
          </Stack>
        </Group>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab value="management" leftSection={<IconList size={16} />}>
              All Changelogs
            </Tabs.Tab>
            <Tabs.Tab value="analytics" leftSection={<IconHistory size={16} />}>
              Analytics
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="management" pt="md">
            <ChangelogManagement
              projectId={projectId}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
            />
          </Tabs.Panel>

          <Tabs.Panel value="analytics" pt="md">
            <Card>
              <Stack gap="md">
                <Title order={3}>Changelog Analytics</Title>
                <Text c="dimmed">
                  Analytics and insights about changelog creation and sharing
                  patterns.
                </Text>
                <Text size="sm">
                  📊 Coming soon: Charts and metrics about changelog
                  performance, sharing rates, customer engagement, and more.
                </Text>
              </Stack>
            </Card>
          </Tabs.Panel>
        </Tabs>

        {/* Modals */}
        <ChangelogDetailsModal
          changelogId={selectedChangelogId}
          opened={showDetailsModal}
          onClose={handleCloseModals}
          onEdit={handleEdit}
        />

        <ChangelogEditModal
          changelogId={selectedChangelogId}
          opened={showEditModal}
          onClose={handleCloseModals}
          onSaved={handleCloseModals}
        />
      </Stack>
    </Container>
  );
}
