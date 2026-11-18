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
import { useEditSprintModal } from "~/app/hooks/useEditSprintModal";
import { type GetOneProjectUseCaseType } from "~/server/logic/project/GetOneProjectUseCase";
import { type GetOneSprintUseCaseType } from "~/server/logic/sprint/GetOneSprintUseCase";
import { State } from "~/shared/types/State";

export default function EditSprintModal({
  sprint,
  project,
  ...props
}: ButtonProps & {
  sprint: GetOneSprintUseCaseType;
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
    updateSprint,
  } = useEditSprintModal(sprint, project);

  return (
    <>
      <Button
        size="md"
        disabled={sprint.state === State.COMPLETED}
        onClick={onOpened}
        {...props}
      >
        {props.children ?? "Edit Sprint"}
      </Button>

      <Modal
        opened={opened || isLoading}
        onClose={onClosed}
        title={<Text fw={600}>Update sprint</Text>}
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

            <NumberInput
              label="Days Remaining"
              required
              withAsterisk
              placeholder="Enter total sprint days remaining"
              {...form.getInputProps("daysRemaining")}
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
                  !sprint.jiraSprintId && form.values.jiraSprintId
                    ? "This will enable syncing tasks from Jira"
                    : sprint.jiraSprintId && !form.values.jiraSprintId
                    ? "Removing Jira link will stop syncing"
                    : sprint.jiraSprintId && form.values.jiraSprintId
                    ? "Currently linked to Jira"
                    : undefined
                }
              />
            )}
          </Stack>

          <ErrorAlert mutation={updateSprint.mutation} />

          <Group mt={16} justify="right" gap="xs">
            <Button variant="default" onClick={onClosed} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.isValid() || isLoading}
              loading={isLoading}
            >
              Update
            </Button>
          </Group>
        </form>
      </Modal>
    </>
  );
}
