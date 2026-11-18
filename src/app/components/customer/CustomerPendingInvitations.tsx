import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconCalendar, IconInfoCircle, IconUser } from "@tabler/icons-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { AcceptInvitationFromDashboardUseCase } from "~/app/logic/customer/AcceptInvitationFromDashboardUseCase";

// Extend dayjs with relative time plugin
dayjs.extend(relativeTime);

interface PendingInvitation {
  id: number;
  token: string;
  email: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  project: {
    id: number;
    name: string;
    description: string | null;
    state: string;
  };
  invitedBy: {
    id: number;
    name: string | null;
    email: string | null;
  };
}

interface CustomerPendingInvitationsProps {
  invitations: PendingInvitation[];
  isLoading: boolean;
}

export default function CustomerPendingInvitations({
  invitations,
  isLoading,
}: CustomerPendingInvitationsProps) {
  const acceptInvitation = new AcceptInvitationFromDashboardUseCase();

  const handleAcceptInvitation = async (invitationId: number) => {
    await acceptInvitation.execute({ invitationId });
  };

  if (isLoading) {
    return (
      <Card withBorder>
        <Text>Loading pending invitations...</Text>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return null; // Don't show the section if there are no pending invitations
  }

  return (
    <Card withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={3}>Pending Invitations</Title>
          <Badge variant="light" color="orange" size="lg">
            {invitations.length} Pending
          </Badge>
        </Group>

        <Alert
          icon={<IconInfoCircle size="1rem" />}
          color="blue"
          variant="light"
        >
          You have pending invitations to join new projects. Accept them to gain access.
        </Alert>

        <Stack gap="sm">
          {invitations.map((invitation) => (
            <Card key={invitation.id} withBorder padding="md" radius="md">
              <Stack gap="xs">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={4}>
                    <Text fw={600} size="lg">
                      {invitation.project.name}
                    </Text>
                    {invitation.project.description && (
                      <Text size="sm" c="dimmed">
                        {invitation.project.description}
                      </Text>
                    )}
                  </Stack>
                  <Badge
                    variant="light"
                    color={invitation.project.state === "Active" ? "green" : "gray"}
                    size="sm"
                  >
                    {invitation.project.state}
                  </Badge>
                </Group>

                <Group gap="md" mt="xs">
                  <Group gap="xs">
                    <IconUser size="1rem" />
                    <Text size="sm" c="dimmed">
                      Invited by {invitation.invitedBy.name || invitation.invitedBy.email || "Unknown"}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <IconCalendar size="1rem" />
                    <Text size="sm" c="dimmed">
                      Expires {dayjs(invitation.expiresAt).fromNow()}
                    </Text>
                  </Group>
                </Group>

                <Group justify="flex-end" mt="md">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptInvitation(invitation.id)}
                    loading={acceptInvitation.isMutating}
                  >
                    Accept Invitation
                  </Button>
                </Group>
              </Stack>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}