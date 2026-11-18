"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconMail,
  IconPlus,
  IconTrash,
  IconUser,
  IconUserCheck,
  IconUserX,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import InviteCustomerModal from "~/app/components/customer/InviteCustomerModal";
import { useCustomerInvitationQueries } from "~/app/hooks/useCustomerQueries";
import { CancelInvitationUseCase } from "~/app/logic/customer/CancelInvitationUseCase";
import { api } from "~/trpc/react";

interface ManageCustomersSectionProps {
  projectId: number;
  projectName: string;
  isInModal?: boolean;
}

export default function ManageCustomersSection({
  projectId,
  projectName,
  isInModal = false,
}: ManageCustomersSectionProps) {
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const cancelInvitation = new CancelInvitationUseCase();

  const { invitations, isLoading } = useCustomerInvitationQueries({
    projectId,
  });

  const utils = api.useUtils();

  const handleCancelInvitation = async (invitationId: number) => {
    try {
      await cancelInvitation.execute({
        invitationId,
        projectId,
      });
      await utils.customer.getProjectInvitations.refetch({ projectId });
    } catch (error) {
      console.error("Error cancelling invitation:", error);
    }
  };

  const getStatusBadge = (status: string, expiresAt: Date) => {
    const isExpired = new Date(expiresAt) < new Date();

    switch (status) {
      case "pending":
        if (isExpired) {
          return (
            <Badge color="red" variant="light">
              Expired
            </Badge>
          );
        }
        return (
          <Badge color="yellow" variant="light">
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge color="green" variant="light">
            Accepted
          </Badge>
        );
      case "cancelled":
        return (
          <Badge color="gray" variant="light">
            Cancelled
          </Badge>
        );
      case "expired":
        return (
          <Badge color="red" variant="light">
            Expired
          </Badge>
        );
      default:
        return (
          <Badge color="gray" variant="light">
            {status}
          </Badge>
        );
    }
  };

  const getStatusIcon = (status: string, hasCustomer: boolean) => {
    switch (status) {
      case "pending":
        return <IconMail size={16} />;
      case "accepted":
        return hasCustomer ? (
          <IconUserCheck size={16} />
        ) : (
          <IconUser size={16} />
        );
      case "cancelled":
      case "expired":
        return <IconUserX size={16} />;
      default:
        return <IconUser size={16} />;
    }
  };

  if (isLoading) {
    const loadingContent = <Text>Loading customer invitations...</Text>;
    return isInModal ? (
      loadingContent
    ) : (
      <Paper p="md" withBorder>
        {loadingContent}
      </Paper>
    );
  }

  const content = (
    <>
      <Group justify="flex-end" mb="md">
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openModal}
          size="sm"
        >
          Invite Customer
        </Button>
      </Group>

      {!invitations || invitations.length === 0 ? (
        <Box ta="center" py="xl">
          <Text c="dimmed" size="sm">
            No customers have been invited to this project yet.
          </Text>
          <Button
            variant="light"
            leftSection={<IconPlus size={16} />}
            onClick={openModal}
            mt="md"
          >
            Send First Invitation
          </Button>
        </Box>
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Customer</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Invited</Table.Th>
              <Table.Th>Expires</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {invitations.map((invitation) => (
              <Table.Tr key={invitation.id}>
                <Table.Td>
                  <Group gap="sm">
                    {getStatusIcon(invitation.status, !!invitation.customer)}
                    <Stack gap={0}>
                      <Text size="sm" fw={500}>
                        {invitation.customer?.name || invitation.email}
                      </Text>
                      {invitation.customer?.companyName?.toLowerCase() !==
                        "none" && (
                        <Text size="xs" c="dimmed">
                          {invitation.customer?.companyName}
                        </Text>
                      )}
                      {!invitation.customer && (
                        <Text size="xs" c="dimmed">
                          {invitation.email}
                        </Text>
                      )}
                    </Stack>
                  </Group>
                </Table.Td>
                <Table.Td>
                  {getStatusBadge(invitation.status, invitation.expiresAt)}
                </Table.Td>
                <Table.Td>
                  <Stack gap={0}>
                    <Text size="sm">
                      {dayjs(invitation.createdAt).format("MMM D, YYYY")}
                    </Text>
                    <Text size="xs" c="dimmed">
                      by {invitation.invitedBy.name}
                    </Text>
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {dayjs(invitation.expiresAt).format("MMM D, YYYY")}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {invitation.status === "pending" && (
                    <Tooltip label="Cancel invitation">
                      <ActionIcon
                        color="red"
                        variant="light"
                        size="sm"
                        onClick={() => handleCancelInvitation(invitation.id)}
                        loading={cancelInvitation.isMutating}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <InviteCustomerModal
        opened={modalOpened}
        onClose={closeModal}
        projectId={projectId}
        projectName={projectName}
      />
    </>
  );

  return isInModal ? (
    content
  ) : (
    <Paper p="md" withBorder>
      {content}
    </Paper>
  );
}
