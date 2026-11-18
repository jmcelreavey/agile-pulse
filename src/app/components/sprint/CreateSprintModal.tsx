"use client";

import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  type ButtonProps,
} from "@mantine/core";
import { IconGitBranch, IconLetterCase } from "@tabler/icons-react";
import ErrorAlert from "~/app/components/base/alert/ErrorAlert";
import { useCreateSprintModal } from "~/app/hooks/useCreateSprintModal";
import { type GetOneProjectUseCaseType } from "~/server/logic/project/GetOneProjectUseCase";

export default function CreateSprintModal({
  project,
  ...props
}: ButtonProps & {
  project: GetOneProjectUseCaseType;
}) {
  const {
    opened,
    isLoading,
    canLinkToJira,
    jiraSprintOptions,
    jiraSprintsLoading,
    form,
    onOpened,
    onClosed,
    handleSubmit,
    createSprint,
  } = useCreateSprintModal(project);

  return (
    <>
      <Button onClick={onOpened} {...props} />

      <Modal
        opened={opened || isLoading}
        onClose={onClosed}
        title={<Text fw={600}>Create sprint</Text>}
        closeOnClickOutside={false}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput
              data-autofocus
              label="Reference"
              maxLength={3}
              placeholder="Enter sprint reference"
              autoComplete="off"
              required
              withAsterisk
              {...form.getInputProps("reference")}
              leftSection={<IconLetterCase size="1rem" />}
              disabled={isLoading}
            />

            <NumberInput
              label="Days"
              required
              withAsterisk
              placeholder="Enter total sprint days"
              {...form.getInputProps("days")}
              disabled={isLoading}
            />

            {canLinkToJira && (
              <Select
                label="Jira Sprint"
                placeholder={
                  jiraSprintsLoading
                    ? "Loading Jira sprints..."
                    : jiraSprintOptions.length === 0
                    ? "No Jira sprints available"
                    : "Link to a Jira sprint (optional)"
                }
                data={jiraSprintOptions}
                searchable
                clearable
                {...form.getInputProps("jiraSprintId")}
                leftSection={<IconGitBranch size="1rem" />}
                disabled={isLoading || jiraSprintsLoading}
                description={
                  form.values.jiraSprintId
                    ? "This will enable syncing tasks from Jira"
                    : undefined
                }
              />
            )}
          </Stack>

          <ErrorAlert mutation={createSprint.mutation} />

          <Group mt={16} justify="right" gap="xs">
            <Button variant="default" onClick={onClosed} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.isValid() || isLoading}
              loading={isLoading}
            >
              Create
            </Button>
          </Group>
        </form>
      </Modal>
    </>
  );
}
