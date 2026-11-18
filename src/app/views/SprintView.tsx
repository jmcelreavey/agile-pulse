"use client";

import { Box, Button, Divider, Group, Paper, Stack, Tooltip } from "@mantine/core";
import { IconArrowLeft, IconEye } from "@tabler/icons-react";
import Link from "next/link";
import CollapsibleRichTextEditor from "~/app/components/base/CollapsibleRichTextEditor";
import { DiscussionSection } from "~/app/components/customer/DiscussionSection";
import { SprintInsights } from "~/app/components/insights/SprintInsights";
import { EntityHeader } from "~/app/components/shared/EntityHeader";
import { DeliveryChart } from "~/app/components/sprint/chart/DeliveryChart";
import { CompleteSprintButton } from "~/app/components/sprint/CompleteSprintButton";
import { DeleteSprintButton } from "~/app/components/sprint/DeleteSprintButton";
import EditSprintModal from "~/app/components/sprint/EditSprintModal";
import { MoveOverrunningTasksButton } from "~/app/components/sprint/MoveOverrunningTasksButton";
import { ProgressSprintButton } from "~/app/components/sprint/ProgressSprintButton";
import { ReopenSprintButton } from "~/app/components/sprint/ReopenSprintButton";
import { RestoreSprintMenu } from "~/app/components/sprint/RestoreSprintMenu";
import { SprintChangelogManagement } from "~/app/components/sprint/SprintChangelogManagement";
import { SprintNavigationButtons } from "~/app/components/sprint/SprintNavigationButtons";
import { StartSprintButton } from "~/app/components/sprint/StartSprintButton";
import { SyncJiraSprintButton } from "~/app/components/sprint/SyncJiraSprintButton";
import CreateSprintTaskModal from "~/app/components/sprint/task/CreateSprintTaskModal";
import { useSprintQueries } from "~/app/hooks/useSprintQueries";
import { InvalidateSprintDataUseCase } from "~/app/logic/sprint/InvalidateSprintDataUseCase";
import { UpdateSprintNotesUseCase } from "~/app/logic/sprint/UpdateSprintNotesUseCase";
import { State } from "~/shared/types/State";

export const SprintView = ({
  sprintId,
  projectId,
  zoomDay,
}: {
  sprintId: number;
  projectId: number;
  zoomDay?: number;
}) => {
  const {
    sprint,
    sprintMembers,
    sprintTasks,
    unassignedTasks,
    sprintDeadlines,
    project,
    isLoading,
    previousSprint,
    nextSprint,
    deletedTaskRecords,
    deletedMemberRecords,
    overrunningTasks,
    jiraConnectionStatus,
    jiraIssuesQuery,
    canSyncWithJira,
    calculateNewTasksCount,
  } = useSprintQueries({
    sprintId,
    projectId,
    zoomDay,
  });

  const isDeletedRecords =
    deletedTaskRecords.length > 0 || deletedMemberRecords.length > 0;

  const invalidateSprintData = new InvalidateSprintDataUseCase();
  const updateNotes = new UpdateSprintNotesUseCase();

  const handleComplete = () => {
    void invalidateSprintData.execute();
  };

  const handleReopen = () => {
    void invalidateSprintData.execute();
  };

  // Get the primary state action based on sprint state
  const getPrimaryStateAction = () => {
    if (sprint.state === State.NOT_STARTED) {
      return <StartSprintButton key="start" sprint={sprint} />;
    } else if (sprint.state === State.IN_PROGRESS) {
      return <ProgressSprintButton key="progress" sprint={sprint} />;
    } else if (sprint.state === State.COMPLETED) {
      return (
        <ReopenSprintButton
          key="reopen"
          sprint={sprint}
          onReopen={handleReopen}
        />
      );
    }
    return null;
  };

  return (
    <Stack>
      <SprintNavigationButtons
        projectId={projectId}
        previousSprintId={previousSprint?.id}
        nextSprintId={nextSprint?.id}
      />

      {/* Back to Sprints Button */}
      <Box>
        <Button
          component={Link}
          href={`/projects/${projectId}`}
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          size="sm"
        >
          Back to Sprints
        </Button>
      </Box>

      <EntityHeader
        entity={{
          name: project.name,
          state: sprint.state,
          colour: project.colour,
          description: project.description,
          startedAt: sprint.startedAt,
        }}
        type="sprint"
        subtitle={sprint.reference}
        showDate={true}
        rightElement={
          <Group gap="xs">
            {canSyncWithJira && (
              <SyncJiraSprintButton
                sprintId={sprint.id}
                jiraSprintId={sprint.jiraSprintId ?? ""}
                cloudId={jiraConnectionStatus.data?.cloudId ?? ""}
                sprintReference={sprint.reference}
                existingTasksCount={sprintTasks.length}
                newTasksCount={calculateNewTasksCount()}
                variant="icon-only"
                isJiraDataLoading={
                  jiraConnectionStatus.isLoading ||
                  jiraConnectionStatus.isFetching ||
                  jiraIssuesQuery.isLoading ||
                  jiraIssuesQuery.isFetching
                }
              />
            )}

            <Tooltip label="View Snapshots">
              <Button
                variant="subtle"
                size="compact-md"
                component={Link}
                href={`./${sprint.id}/snapshots`}
              >
                <IconEye size={16} />
              </Button>
            </Tooltip>

            {isDeletedRecords && (
              <RestoreSprintMenu
                deletedTasks={deletedTaskRecords}
                deletedMembers={deletedMemberRecords}
                onRestore={() => {
                  void invalidateSprintData.execute();
                }}
              />
            )}
            <DeleteSprintButton sprint={sprint} variant="icon-only" />
          </Group>
        }
      />
      <Box pos="relative" py={32}>
        {/* Improved Action Bar */}
        <Group gap="xl" mb="xl" justify="space-between">
          {/* Primary Actions */}
          <Group gap="md">
            <CreateSprintTaskModal size="md" sprint={sprint}>
              Add Task
            </CreateSprintTaskModal>

            {getPrimaryStateAction()}

            {sprint.state === State.IN_PROGRESS && (
              <CompleteSprintButton
                sprint={sprint}
                onComplete={handleComplete}
              />
            )}

            {sprint.state !== State.COMPLETED &&
              overrunningTasks.length > 0 && (
                <MoveOverrunningTasksButton
                  projectId={projectId}
                  sprint={sprint}
                />
              )}
          </Group>

          {/* Secondary Actions */}
          <Group gap="sm">
            <EditSprintModal sprint={sprint} project={project} />
          </Group>
        </Group>

        <CollapsibleRichTextEditor
          title="Sprint Notes"
          locked={sprint.state === State.COMPLETED}
          initialContent={sprint.notes ?? ""}
          placeholder="Click here to add sprint goals, important links, and additional information for your team."
          onSave={async (notes) => {
            await updateNotes.execute({
              sprintNotes: {
                id: sprint.id,
                notes,
              },
            });
          }}
        />
        
        <Divider my={38} />
        <DeliveryChart
          project={project}
          sprintDeadlines={sprintDeadlines}
          isLoading={isLoading}
          sprint={sprint}
          members={sprintMembers}
          sprintTasks={sprintTasks}
          unassignedTasks={unassignedTasks}
          isDisabled={sprint.state === State.COMPLETED}
          zoomDay={zoomDay}
        />
        
        <SprintInsights sprintId={sprintId} isCompleted={sprint.state === State.COMPLETED} isNotStarted={sprint.state === State.NOT_STARTED} />

        {/* Sprint Changelog Management */}
        <SprintChangelogManagement
          sprintId={sprintId}
          projectId={projectId}
          sprintName={`Sprint ${sprint.reference}`}
          projectName={project.name}
          disabled={!sprintTasks || sprintTasks.length === 0}
          disabledReason={
            !sprintTasks || sprintTasks.length === 0
              ? "No tasks in this sprint to generate changelog from"
              : undefined
          }
        />

        {/* Sprint Discussion */}
        <Paper p="xl" withBorder mt="xl">
          <DiscussionSection
            projectId={projectId.toString()}
            sprintId={sprintId.toString()}
            title={`Sprint ${sprint.reference} Discussion`}
          />
        </Paper>
      </Box>
    </Stack>
  );
};
