import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { SyncJiraSprintUseCase } from "~/app/logic/jira/SyncJiraSprintUseCase";

interface JiraSyncData {
  sprintId: number;
  jiraSprintId: string;
  cloudId: string;
  sprintReference: string;
  existingTasksCount?: number;
  newTasksCount?: number;
}

export const useJiraSyncWarningModal = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [syncData, setSyncData] = useState<JiraSyncData | null>(null);
  const [overrideExisting, setOverrideExisting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const syncJiraSprint = new SyncJiraSprintUseCase();

  const openModal = (data: JiraSyncData) => {
    setSyncData(data);
    setOverrideExisting(false);
    setConfirmed(false);
    open();
  };

  const closeModal = () => {
    close();
    setSyncData(null);
    setOverrideExisting(false);
    setConfirmed(false);
    syncJiraSprint.setIsMutating(false);
  };

  const handleSubmit = async () => {
    if (!syncData) return;

    const { sprintId, jiraSprintId, cloudId, sprintReference } = syncData;

    await syncJiraSprint.execute({
      input: {
        sprintId,
        jiraSprintId,
        cloudId,
        overrideExisting,
      },
      sprintReference,
    });

    closeModal();
  };

  const hasExistingTasks = (syncData?.existingTasksCount ?? 0) > 0;
  const isLoading =
    syncJiraSprint.mutation.isPending || syncJiraSprint.isMutating;
  const canSubmit =
    !isLoading && (!hasExistingTasks || !overrideExisting || confirmed);

  return {
    // State
    opened,
    syncData,
    overrideExisting,
    confirmed,
    hasExistingTasks,
    isLoading,
    canSubmit,

    // Actions
    openModal,
    closeModal,
    handleSubmit,
    setOverrideExisting,
    setConfirmed,

    // Use case for error handling
    syncJiraSprint,
  };
};
