"use client";

import {
  Alert,
  Button,
  Checkbox,
  Group,
  List,
  Modal,
  Stack,
  Text,
  type ModalProps,
} from "@mantine/core";
import { IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";

interface JiraSyncWarningModalProps
  extends Omit<ModalProps, "opened" | "onClose"> {
  opened: boolean;
  onClose: () => void;
  sprintReference: string;
  existingTasksCount: number;
  newTasksCount: number;
  hasExistingTasks: boolean;
  overrideExisting: boolean;
  confirmed: boolean;
  isLoading: boolean;
  canSubmit: boolean;
  onOverrideExistingChange: (checked: boolean) => void;
  onConfirmedChange: (checked: boolean) => void;
  onSubmit: () => void;
}

export function JiraSyncWarningModal({
  opened,
  onClose,
  sprintReference,
  existingTasksCount,
  newTasksCount,
  hasExistingTasks,
  overrideExisting,
  confirmed,
  isLoading,
  canSubmit,
  onOverrideExistingChange,
  onConfirmedChange,
  onSubmit,
  ...props
}: JiraSyncWarningModalProps) {
  return (
    <Modal
      {...props}
      opened={opened}
      onClose={onClose}
      title="Sync Sprint with Jira"
      size="md"
      centered
    >
      <Stack gap="md">
        <Alert
          icon={<IconInfoCircle size={16} />}
          title="Sprint Synchronization"
          color="blue"
        >
          <Text size="sm">
            You are about to synchronize sprint{" "}
            <strong>{sprintReference}</strong> with Jira data.
          </Text>
        </Alert>

        {hasExistingTasks && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            title="Existing Tasks Found"
            color="orange"
          >
            <Text size="sm" mb="xs">
              This sprint already contains <strong>{existingTasksCount}</strong>{" "}
              task{existingTasksCount !== 1 ? "s" : ""}. Please choose how to
              handle them:
            </Text>
          </Alert>
        )}

        <Alert
          icon={<IconInfoCircle size={16} />}
          title="What will happen:"
          color="gray"
          variant="light"
        >
          <List size="sm" spacing="xs">
            <List.Item>
              <strong>
                {newTasksCount !== undefined ? newTasksCount : "Loading..."}
              </strong>{" "}
              new task
              {newTasksCount !== 1 ? "s" : ""} will be created from Jira issues
            </List.Item>
            <List.Item>
              User assignments will be mapped based on email addresses
            </List.Item>
            <List.Item>Task states will be mapped from Jira statuses</List.Item>
          </List>
        </Alert>

        {hasExistingTasks && (
          <Checkbox
            checked={overrideExisting}
            onChange={(event) =>
              onOverrideExistingChange(event.currentTarget.checked)
            }
            label={
              <Text size="sm">
                <strong>Override existing tasks</strong> - Update existing tasks
                with Jira data (Jira takes precedence)
              </Text>
            }
          />
        )}

        {overrideExisting && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            title="Warning: Data Override"
            color="red"
            variant="light"
          >
            <Text size="sm">
              Existing task data will be overwritten with Jira data. This action
              cannot be undone. Task names, descriptions, states, and
              assignments will be updated to match Jira.
            </Text>
          </Alert>
        )}

        {hasExistingTasks && overrideExisting && (
          <Checkbox
            checked={confirmed}
            onChange={(event) => onConfirmedChange(event.currentTarget.checked)}
            label={
              <Text size="sm">
                I understand that existing task data will be overwritten and
                this action cannot be undone
              </Text>
            }
          />
        )}

        <Group justify="right" gap="xs">
          <Button variant="default" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit} loading={isLoading}>
            {hasExistingTasks && overrideExisting
              ? "Override & Sync"
              : "Sync Sprint"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
