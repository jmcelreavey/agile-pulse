import { Button, Tooltip } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { JiraSyncWarningModal } from "~/app/components/jira/JiraSyncWarningModal";
import { useJiraSyncWarningModal } from "~/app/hooks/useJiraSyncWarningModal";

interface SyncJiraSprintButtonProps {
  sprintId: number;
  jiraSprintId: string;
  cloudId: string;
  sprintReference: string;
  existingTasksCount?: number;
  newTasksCount?: number;
  variant?: "default" | "icon-only";
  isJiraDataLoading?: boolean;
}

export function SyncJiraSprintButton({
  sprintId,
  jiraSprintId,
  cloudId,
  sprintReference,
  existingTasksCount = 0,
  newTasksCount,
  variant = "default",
  isJiraDataLoading = false,
}: SyncJiraSprintButtonProps) {
  const {
    opened,
    syncData,
    overrideExisting,
    confirmed,
    hasExistingTasks,
    isLoading,
    canSubmit,
    openModal,
    closeModal,
    handleSubmit,
    setOverrideExisting,
    setConfirmed,
  } = useJiraSyncWarningModal();

  const handleClick = () => {
    // Only open the modal if we have valid data
    if (!isJiraDataLoading && newTasksCount !== undefined) {
      openModal({
        sprintId,
        jiraSprintId,
        cloudId,
        sprintReference,
        existingTasksCount,
        newTasksCount: newTasksCount ?? 0,
      });
    }
  };

  // Determine if button should be disabled
  const isButtonDisabled =
    isLoading || isJiraDataLoading || newTasksCount === undefined;
  // Use loading state for button when Jira data is loading
  const isButtonLoading = isLoading || isJiraDataLoading;

  return (
    <>
      {variant === "icon-only" ? (
        <Tooltip
          label={isJiraDataLoading ? "Loading Jira data..." : "Sync with Jira"}
        >
          <Button
            leftSection={
              variant === "icon-only" ? undefined : <IconRefresh size={16} />
            }
            onClick={handleClick}
            disabled={isButtonDisabled}
            loading={isButtonLoading}
            variant={variant === "icon-only" ? "subtle" : "subtle"}
            size={variant === "icon-only" ? "compact-md" : "md"}
          >
            {variant === "icon-only" ? (
              <IconRefresh size={16} />
            ) : (
              "Sync with Jira"
            )}
          </Button>
        </Tooltip>
      ) : (
        <Button
          leftSection={<IconRefresh size={16} />}
          onClick={handleClick}
          disabled={isButtonDisabled}
          loading={isButtonLoading}
          variant="subtle"
          size="md"
        >
          {isJiraDataLoading ? "Loading Jira data..." : "Sync with Jira"}
        </Button>
      )}

      {syncData && (
        <JiraSyncWarningModal
          opened={opened}
          onClose={closeModal}
          sprintReference={syncData.sprintReference}
          existingTasksCount={syncData.existingTasksCount ?? 0}
          newTasksCount={syncData.newTasksCount ?? 0}
          hasExistingTasks={hasExistingTasks}
          overrideExisting={overrideExisting}
          confirmed={confirmed}
          isLoading={isLoading}
          canSubmit={canSubmit}
          onOverrideExistingChange={setOverrideExisting}
          onConfirmedChange={setConfirmed}
          onSubmit={() => void handleSubmit()}
        />
      )}
    </>
  );
}
