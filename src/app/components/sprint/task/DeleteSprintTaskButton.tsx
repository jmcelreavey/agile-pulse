"use client";

import { type ButtonProps } from "@mantine/core";
import { DeleteButton } from "~/app/components/delete/DeleteButton";
import { DeleteSprintTaskUseCase } from "~/app/logic/sprint/DeleteSprintTaskUseCase";
import { type GetOneTaskUseCaseType } from "~/server/logic/task/GetOneTaskUseCase";
import { DeleteSource } from "~/shared/types/DeleteSource";

export const DeleteSprintTaskButton = ({
  task,
  onDeleted,
  ...props
}: {
  task: GetOneTaskUseCaseType;
  onDeleted?: () => Promise<void>;
} & ButtonProps) => {
  const deleteSprintTask = new DeleteSprintTaskUseCase();

  return (
    <DeleteButton
      onDelete={async () => {
        await deleteSprintTask.execute({
          sprintMemberId: task.id,
          reference: task.name,
        });
      }}
      onDeleted={async () => {
        await onDeleted?.();
      }}
      recordName={task.name}
      source={DeleteSource.TASK}
      {...props}
    />
  );
};
