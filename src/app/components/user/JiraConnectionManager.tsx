"use client";

import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconCheck,
  IconClock,
  IconExternalLink,
  IconRefresh,
  IconUnlink,
} from "@tabler/icons-react";
import { SiJira } from "react-icons/si";
import ErrorAlert from "~/app/components/base/alert/ErrorAlert";
import { useJiraConnectionModal } from "~/app/hooks/useJiraConnectionModal";

interface JiraConnectionManagerProps {
  opened: boolean;
  onClose: () => void;
  // Optional hook state - if not provided, will create its own
  hookState?: ReturnType<typeof useJiraConnectionModal>;
}

export default function JiraConnectionManager({
  opened,
  onClose,
  hookState,
}: JiraConnectionManagerProps) {
  // Use provided hook state or create our own
  const internalHook = useJiraConnectionModal();
  const {
    fullName,
    connectionState,
    isLoading,
    isConnecting,
    handleOAuthSignIn,
    handleAutoConfigureFromOAuth,
    handleUnlink,
    handleRefreshConnection,
    jiraConnectionUseCase,
  } = hookState || internalHook;

  try {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <Group gap="sm">
            <SiJira size={24} color="#0052CC" />
            <Title order={4}>Jira Integration</Title>
          </Group>
        }
        size="md"
        centered
        closeOnClickOutside={false}
        withinPortal
      >
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <div></div>
            {connectionState === "connected" && (
              <Badge
                color="green"
                variant="light"
                leftSection={<IconCheck size={12} />}
              >
                Connected
              </Badge>
            )}

            {connectionState === "configuring" && (
              <Badge
                color="blue"
                variant="light"
                leftSection={<IconClock size={12} />}
              >
                Connecting...
              </Badge>
            )}

            {connectionState === "ready-to-configure" && (
              <Badge
                color="orange"
                variant="light"
                leftSection={<IconClock size={12} />}
              >
                Ready to Connect
              </Badge>
            )}
          </Group>

          {connectionState === "connected" ? (
            <Stack gap="sm">
              <Alert color="green" variant="light">
                <Text size="sm">
                  <strong>Connected as:</strong> {fullName || "Unknown"}
                </Text>
                <Text size="sm" c="dimmed">
                  Your Jira account is connected and ready to use
                </Text>
              </Alert>

              <Group gap="xs">
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<IconRefresh size={16} />}
                  onClick={() => void handleRefreshConnection()}
                  loading={isLoading}
                >
                  Refresh Connection
                </Button>

                <Button
                  size="sm"
                  variant="subtle"
                  color="red"
                  leftSection={<IconUnlink size={16} />}
                  onClick={() => void handleUnlink()}
                  loading={isLoading}
                >
                  Disconnect
                </Button>
              </Group>
            </Stack>
          ) : connectionState === "configuring" ? (
            <Stack gap="sm">
              <Alert color="blue" variant="light">
                <Text size="sm">
                  Setting up your Jira connection automatically...
                </Text>
              </Alert>
              <Button
                leftSection={<SiJira size={18} />}
                loading={true}
                size="md"
                disabled
              >
                Configuring Jira Connection
              </Button>
            </Stack>
          ) : connectionState === "ready-to-configure" ? (
            <Stack gap="sm">
              <Alert color="orange" variant="light">
                <Text size="sm">
                  <strong>Almost there!</strong> You&apos;ve signed in with
                  Jira. Click below to complete the connection.
                </Text>
              </Alert>
              <Button
                leftSection={<SiJira size={18} />}
                onClick={() => void handleAutoConfigureFromOAuth()}
                loading={isLoading}
                size="md"
                color="orange"
              >
                Complete Jira Connection
              </Button>
            </Stack>
          ) : (
            <Stack gap="sm">
              <Text size="sm" c="dimmed">
                Connect your Jira account to sync projects, sprints, and issues.
              </Text>
              <Button
                leftSection={<SiJira size={18} />}
                rightSection={<IconExternalLink size={16} />}
                onClick={() => void handleOAuthSignIn()}
                loading={isConnecting}
                size="md"
              >
                Sign in with Jira
              </Button>
            </Stack>
          )}

          <ErrorAlert mutation={jiraConnectionUseCase.autoConfigureMutation} />
          <ErrorAlert mutation={jiraConnectionUseCase.unlinkMutation} />
        </Stack>
      </Modal>
    );
  } catch (error) {
    console.error("Error rendering JiraConnectionManager:", error);
    return <Text>Error rendering modal</Text>;
  }
}
