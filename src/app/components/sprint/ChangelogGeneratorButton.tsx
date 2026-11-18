"use client";

import { Button, Tooltip } from "@mantine/core";
import { IconFileText } from "@tabler/icons-react";
import { useState } from "react";
import { type ChangelogTone } from "~/shared/types/changelog";
import { ChangelogModal } from "~/app/components/sprint/ChangelogModal";
import { TaskSelectionModal } from "~/app/components/sprint/TaskSelectionModal";

interface ChangelogGeneratorButtonProps {
  sprintId: number;
  projectId: number;
  sprintName: string;
  projectName: string;
  disabled?: boolean;
  disabledReason?: string;
}

export const ChangelogGeneratorButton = ({
  sprintId,
  projectId,
  sprintName,
  projectName,
  disabled = false,
  disabledReason,
}: ChangelogGeneratorButtonProps) => {
  const [isTaskSelectionOpen, setIsTaskSelectionOpen] = useState(false);
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);

  const handleTaskSelectionComplete = (taskIds: number[]) => {
    setSelectedTaskIds(taskIds);
    setIsTaskSelectionOpen(false);
    setIsChangelogModalOpen(true);
  };

  const handleChangelogGenerated = async (
    content: string,
    tone: ChangelogTone,
    taskIds: number[]
  ) => {
    console.log("Changelog saved successfully:", {
      contentLength: content.length,
      tone,
      taskCount: taskIds.length,
    });
    // The actual saving is handled by the ChangelogModal via the useChangelogGenerator hook
  };

  const buttonElement = (
    <Button
      leftSection={<IconFileText size={16} />}
      size="md"
      onClick={() => setIsTaskSelectionOpen(true)}
      disabled={disabled}
    >
      Generate Changelog
    </Button>
  );

  return (
    <>
      {disabled && disabledReason ? (
        <Tooltip label={disabledReason} withinPortal>
          {buttonElement}
        </Tooltip>
      ) : (
        buttonElement
      )}

      <TaskSelectionModal
        sprintId={sprintId}
        projectId={projectId}
        opened={isTaskSelectionOpen}
        onClose={() => setIsTaskSelectionOpen(false)}
        onSelectionComplete={handleTaskSelectionComplete}
      />

      <ChangelogModal
        opened={isChangelogModalOpen}
        onClose={() => setIsChangelogModalOpen(false)}
        sprintId={sprintId}
        projectId={projectId}
        selectedTaskIds={selectedTaskIds}
        sprintName={sprintName}
        projectName={projectName}
        onGenerated={handleChangelogGenerated}
      />
    </>
  );
};
