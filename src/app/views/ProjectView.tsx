"use client";

import { Box, Button, Group, Paper, Stack } from "@mantine/core";
import { IconArrowLeft, IconUsers } from "@tabler/icons-react";
import Link from "next/link";
import CollapsibleRichTextEditor from "~/app/components/base/CollapsibleRichTextEditor";
import CustomerAccessModal from "~/app/components/customer/CustomerAccessModal";
import { DiscussionSection } from "~/app/components/customer/DiscussionSection";
import { RestoreButton } from "~/app/components/delete/RestoreButton";
import { CompleteProjectButton } from "~/app/components/project/CompleteProjectButton";
import { DeleteProjectButton } from "~/app/components/project/DeleteProjectButton";
import EditProjectModal from "~/app/components/project/EditProjectModal";
import { ReopenProjectButton } from "~/app/components/project/ReopenProjectButton";
import SharedProjectSpace from "~/app/components/project/SharedProjectSpace";
import { StartProjectButton } from "~/app/components/project/StartProjectButton";
import { EntityHeader } from "~/app/components/shared/EntityHeader";
import CreateSprintModal from "~/app/components/sprint/CreateSprintModal";
import SprintCards from "~/app/components/sprint/SprintCards";
import { useProjectQueries } from "~/app/hooks/useProjectQueries";
import { InvalidateProjectDataUseCase } from "~/app/logic/project/InvalidateProjectDataUseCase";
import { UpdateProjectNotesUseCase } from "~/app/logic/project/UpdateProjectNotesUseCase";
import { UpdateProjectSharedNotesUseCase } from "~/app/logic/project/UpdateProjectSharedNotesUseCase";
import { DeleteSource } from "~/shared/types/DeleteSource";
import { State } from "~/shared/types/State";

export const ProjectView = ({ projectId }: { projectId: number }) => {
  const { sprints, project, deletedRecords, isLoading } = useProjectQueries({
    projectId,
  });
  const invalidateProjectData = new InvalidateProjectDataUseCase();
  const updateNotes = new UpdateProjectNotesUseCase();
  const updateSharedNotes = new UpdateProjectSharedNotesUseCase();

  const handleComplete = () => {
    void invalidateProjectData.execute();
  };

  const handleReopen = () => {
    void invalidateProjectData.execute();
  };

  // Get the primary state action based on project state
  const getPrimaryStateAction = () => {
    if (project.state === State.NOT_STARTED) {
      return <StartProjectButton project={project} />;
    } else if (project.state === State.IN_PROGRESS) {
      return (
        <CompleteProjectButton project={project} onComplete={handleComplete} />
      );
    } else if (project.state === State.COMPLETED) {
      return <ReopenProjectButton project={project} onReopen={handleReopen} />;
    }
    return null;
  };

  return (
    <Box>
      <Stack>
        {/* Back to Dashboard Button */}
        <Box>
          <Button
            component={Link}
            href="/"
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            size="sm"
          >
            Back to Dashboard
          </Button>
        </Box>

        <EntityHeader
          entity={{
            name: project.name,
            state: project.state,
            colour: project.colour,
            description: project.description,
            startedAt: project.startedAt,
          }}
          rightElement={
            <Group gap="xs">
              <RestoreButton
                onRestore={() => {
                  void invalidateProjectData.execute();
                }}
                deletedRecords={deletedRecords}
                source={DeleteSource.SPRINT}
              />
              <DeleteProjectButton project={project} variant="icon-only" />
            </Group>
          }
          showDate={true}
        />

        <Box pos="relative" py={32}>
          {/* Compact Action Bar */}
          <Group gap="xl" mb="xl" justify="space-between">
            {/* Primary Actions */}
            <Group gap="md">
              <CreateSprintModal size="md" project={project}>
                Create Sprint
              </CreateSprintModal>

              {getPrimaryStateAction()}
            </Group>

            {/* Secondary Actions */}
            <Group gap="sm">
              <CustomerAccessModal
                projectId={project.id}
                projectName={project.name}
              >
                <Button leftSection={<IconUsers size={16} />} size="md">
                  Customer Access
                </Button>
              </CustomerAccessModal>
              <EditProjectModal project={project} />
            </Group>
          </Group>

          <Stack>
            {/* Shared Project Space */}
            <SharedProjectSpace
              projectId={project.id}
              initialContent={project.sharedNotes ?? ""}
              showLabel={true}
              labelText="Shared with customer"
              onSave={async (sharedNotes) => {
                await updateSharedNotes.execute({
                  projectSharedNotes: {
                    id: project.id,
                    sharedNotes,
                  },
                });
              }}
            />

            {/* Private Project Notes */}
            <CollapsibleRichTextEditor
              title="" // No title on developer side, label is sufficient
              initialContent={project.notes ?? ""}
              placeholder="Click here to add private project information and notes for your team only."
              locked={project.state === State.COMPLETED}
              showLabel={true}
              labelText="Not visible to customer"
              onSave={async (notes) => {
                await updateNotes.execute({
                  projectNotes: {
                    id: project.id,
                    notes,
                  },
                });
              }}
            />
          </Stack>

          <Stack mt={32} gap="xl" id="sprints">
            <SprintCards
              isLoading={isLoading}
              sprints={sprints}
              project={project}
            />
          </Stack>

          {/* Project Discussion Section */}
          <Paper p="xl" withBorder mt="xl">
            <DiscussionSection
              projectId={project.id.toString()}
              title="Project Discussion"
            />
          </Paper>
        </Box>
      </Stack>
    </Box>
  );
};
