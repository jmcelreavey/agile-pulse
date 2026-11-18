"use client";

import {
  Button,
  ColorInput,
  Group,
  Modal,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  type ButtonProps,
} from "@mantine/core";
import {
  IconExternalLink,
  IconLetterCase,
  IconLink,
} from "@tabler/icons-react";
import ErrorAlert from "~/app/components/base/alert/ErrorAlert";
import { useEditProjectModal } from "~/app/hooks/useEditProjectModal";
import { type GetOneProjectUseCaseType } from "~/server/logic/project/GetOneProjectUseCase";
import { State } from "~/shared/types/State";

export default function EditProjectModal({
  project,
  ...props
}: ButtonProps & {
  project: GetOneProjectUseCaseType;
}) {
  const {
    opened,
    isLoading,
    canLinkToJira,
    isLinked,
    configMode,
    jiraProjectOptions,
    jiraProjectsLoading,
    selectedJiraProject,
    form,
    onOpened,
    onClosed,
    handleSubmit,
    handleJiraProjectChange,
    handleConfigModeChange,
    updateProject,
  } = useEditProjectModal(project);

  return (
    <>
      <Button
        size="md"
        disabled={project.state === State.COMPLETED}
        onClick={onOpened}
        {...props}
      >
        {props.children ?? "Edit Project"}
      </Button>

      <Modal
        opened={opened || isLoading}
        onClose={onClosed}
        title={<Text fw={600}>Update project</Text>}
        closeOnClickOutside={false}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput
              data-autofocus
              label="Name"
              placeholder="Enter project name"
              autoComplete="off"
              required
              withAsterisk
              {...form.getInputProps("name")}
              leftSection={<IconLetterCase size="1rem" />}
              disabled={isLoading}
            />

            <Textarea
              label="Description"
              required
              withAsterisk
              placeholder="Enter project description"
              {...form.getInputProps("description")}
              disabled={isLoading}
            />

            <ColorInput
              label="Colour"
              placeholder="Select a colour"
              {...form.getInputProps("colour")}
              disabled={isLoading}
            />

            {canLinkToJira && (
              <>
                <SegmentedControl
                  value={configMode}
                  onChange={(value) =>
                    handleConfigModeChange(value)
                  }
                  data={[
                    {
                      label: "Custom",
                      value: "custom",
                    },
                    {
                      label: "Jira",
                      value: "jira",
                    },
                  ]}
                  disabled={isLoading}
                />

                {configMode === "jira" ? (
                  <Select
                    label="Jira Project"
                    placeholder={
                      jiraProjectsLoading
                        ? "Loading Jira projects..."
                        : jiraProjectOptions.length === 0
                        ? "No Jira projects available"
                        : "Select a Jira project"
                    }
                    data={jiraProjectOptions}
                    value={selectedJiraProject}
                    onChange={handleJiraProjectChange}
                    searchable
                    clearable
                    leftSection={<IconLink size="1rem" />}
                    disabled={isLoading || jiraProjectsLoading}
                    description={
                      !isLinked && selectedJiraProject
                        ? "This will enable sprint and task syncing from Jira"
                        : isLinked && !selectedJiraProject
                        ? "Removing Jira link will stop syncing"
                        : isLinked && selectedJiraProject
                        ? "Currently linked to Jira"
                        : "This will enable sprint and task syncing from Jira"
                    }
                  />
                ) : (
                  <>
                    <TextInput
                      label="Ticket URL Template"
                      placeholder="https://agile-pulse.atlassian.net/browse/"
                      autoComplete="off"
                      {...form.getInputProps("ticketUrlTemplate")}
                      leftSection={<IconExternalLink size="1rem" />}
                      disabled={isLoading}
                      description="Template URL for ticket links (e.g., https://your-domain.atlassian.net/browse/)"
                    />

                    <TextInput
                      label="Ticket URL Prefix"
                      placeholder="AP-"
                      autoComplete="off"
                      {...form.getInputProps("ticketUrlPrefix")}
                      leftSection={<IconLetterCase size="1rem" />}
                      disabled={isLoading}
                      description="Prefix for ticket IDs (e.g., AP-, PROJ-)"
                    />
                  </>
                )}
              </>
            )}

            {!canLinkToJira && (
              <>
                <TextInput
                  label="Ticket URL Template"
                  placeholder="https://agile-pulse.atlassian.net/browse/"
                  autoComplete="off"
                  {...form.getInputProps("ticketUrlTemplate")}
                  leftSection={<IconExternalLink size="1rem" />}
                  disabled={isLoading}
                  description="Template URL for ticket links"
                />

                <TextInput
                  label="Ticket URL Prefix"
                  placeholder="AP-"
                  autoComplete="off"
                  {...form.getInputProps("ticketUrlPrefix")}
                  leftSection={<IconLetterCase size="1rem" />}
                  disabled={isLoading}
                  description="Prefix for ticket IDs"
                />
              </>
            )}
          </Stack>

          <ErrorAlert mutation={updateProject.mutation} />

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
