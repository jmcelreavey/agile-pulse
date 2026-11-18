'use client';

import {
    ActionIcon,
    Badge,
    Button,
    Card,
    Group,
    Modal,
    Pagination,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
    Title,
    Tooltip,
} from "@mantine/core";
import {
  IconEdit,
  IconEye,
  IconEyeOff,
  IconFileTypePdf,
  IconFilter,
  IconMail,
  IconRefresh,
  IconSearch,
  IconShare,
  IconTrash,
} from "@tabler/icons-react";
import { useChangelogManagement } from "~/app/hooks/useChangelogManagement";
import { EmptyState } from "~/app/components/shared/EmptyState";

interface ChangelogManagementProps {
  projectId?: number;
  sprintId?: number;
  onViewDetails?: (changelogId: number) => void;
  onEdit?: (changelogId: number) => void;
}

export function ChangelogManagement({
  projectId,
  sprintId,
  onViewDetails,
  onEdit,
}: ChangelogManagementProps) {
  const {
    changelogsData,
    isLoading,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    publishedFilter,
    setPublishedFilter,
    showDeleteModal,
    showEmailModal,
    emailChangelog,
    refetch,
    handleDelete,
    handlePublish,
    handleDeleteClick,
    handleCloseDeleteModal,
    handleCloseEmailModal,
    handleConfirmEmail,
    handlePreviewPdf,
    handleEmailChangelog,
    formatDate,
    getStatusBadge,
    isDeleting,
    isPublishing,
    isPreviewingPdf,
    isEmailingChangelog,
  } = useChangelogManagement({ projectId, sprintId });

  const getStatusBadgeComponent = (
    isPublished: boolean,
    sharedAt: string | Date | null
  ) => {
    const { color, label } = getStatusBadge(isPublished, sharedAt);
    return <Badge color={color}>{label}</Badge>;
  };

  return (
    <Card padding="lg">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2}>Changelog Management</Title>
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={() => void refetch()}
            loading={isLoading}
          >
            Refresh
          </Button>
        </Group>

        {/* Filters */}
        <Group gap="md">
          <TextInput
            placeholder="Search changelogs..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by status"
            leftSection={<IconFilter size={16} />}
            data={[
              { value: "all", label: "All" },
              { value: "draft", label: "Drafts" },
              { value: "published", label: "Published" },
            ]}
            value={publishedFilter}
            onChange={setPublishedFilter}
            clearable
          />
        </Group>

        {/* Table */}
        {isLoading ? (
          <Text>Loading changelogs...</Text>
        ) : !changelogsData?.data.length ? (
          <EmptyState
            title="No changelogs found"
            description="Create your first changelog by generating one for a sprint."
          />
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Sprint</Table.Th>
                <Table.Th>Project</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Sharing</Table.Th>
                <Table.Th>Version</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Updated</Table.Th>
                <Table.Th>Creator</Table.Th>
                <Table.Th>Shares</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {changelogsData.data.map((changelog) => (
                <Table.Tr key={changelog.id}>
                  <Table.Td>
                    <Text fw={500}>{changelog.sprint.reference}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{changelog.sprint.project.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    {getStatusBadgeComponent(
                      changelog.isPublished,
                      changelog.sharedAt
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {changelog.sharedViaEmail && (
                        <Tooltip label="Emailed to customers">
                          <Badge
                            size="xs"
                            variant="light"
                            color="blue"
                            leftSection={<IconMail size={10} />}
                          >
                            Email
                          </Badge>
                        </Tooltip>
                      )}
                      {changelog.exportedToPdf && (
                        <Tooltip label="PDF exported">
                          <Badge
                            size="xs"
                            variant="light"
                            color="green"
                            leftSection={<IconFileTypePdf size={10} />}
                          >
                            PDF
                          </Badge>
                        </Tooltip>
                      )}
                      {!changelog.sharedViaEmail && !changelog.exportedToPdf && changelog.isPublished && (
                        <Text size="xs" c="dimmed">-</Text>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="outline">v{changelog.version}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(changelog.createdAt)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(changelog.updatedAt)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {changelog.creator?.name || "Unknown"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="blue">
                      {changelog._count.sharingHistory}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {/* Developer Actions */}
                      <Tooltip label="View Details">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => onViewDetails?.(changelog.id)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>

                      <Tooltip label="Preview/Download PDF">
                        <ActionIcon
                          variant="light"
                          color="indigo"
                          onClick={() => handlePreviewPdf(changelog)}
                          loading={isPreviewingPdf}
                        >
                          <IconEyeOff size={16} />
                        </ActionIcon>
                      </Tooltip>

                      <Tooltip label="Edit Changelog">
                        <ActionIcon
                          variant="light"
                          color="orange"
                          onClick={() => onEdit?.(changelog.id)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>

                      <Tooltip
                        label={changelog.isPublished ? "Unpublish" : "Publish"}
                      >
                        <ActionIcon
                          variant="light"
                          color={changelog.isPublished ? "gray" : "green"}
                          onClick={() =>
                            handlePublish(changelog.id, changelog.isPublished)
                          }
                          loading={isPublishing}
                        >
                          <IconShare size={16} />
                        </ActionIcon>
                      </Tooltip>

                      {/* Customer Sharing Actions (only for published changelogs) */}
                      {changelog.isPublished && (
                        <Tooltip label="Email to Customers">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => handleEmailChangelog(changelog)}
                            loading={isEmailingChangelog}
                          >
                            <IconMail size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}

                      <Tooltip label="Delete">
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDeleteClick(changelog.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Group justify="center">
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              size="sm"
            />
          </Group>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          opened={showDeleteModal}
          onClose={handleCloseDeleteModal}
          title="Confirm Deletion"
          centered
        >
          <Stack gap="md">
            <Text>
              Are you sure you want to delete this changelog? This action cannot
              be undone.
            </Text>
            <Group justify="flex-end">
              <Button variant="light" onClick={handleCloseDeleteModal}>
                Cancel
              </Button>
              <Button color="red" onClick={handleDelete} loading={isDeleting}>
                Delete
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Email Confirmation Modal */}
        <Modal
          opened={showEmailModal}
          onClose={handleCloseEmailModal}
          title="Confirm Email Send"
          centered
        >
          <Stack gap="md">
            <Text>
              Are you sure you want to email this changelog to all customers for{" "}
              <strong>{emailChangelog?.sprint.project.name}</strong>?
            </Text>
            <Text size="sm" c="dimmed">
              This will send the changelog to all customers who have access to this project.
            </Text>
            <Group justify="flex-end">
              <Button variant="light" onClick={handleCloseEmailModal}>
                Cancel
              </Button>
              <Button 
                color="blue" 
                onClick={handleConfirmEmail} 
                loading={isEmailingChangelog}
                leftSection={<IconMail size={16} />}
              >
                Send Email
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Card>
  );
}
