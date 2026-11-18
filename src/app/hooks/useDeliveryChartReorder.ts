import { useEffect, useState } from "react";
import {
  type UpdateSprintMemberOrderInputType,
  type UpdateSprintTaskOrderInputType,
} from "~/server/api/schemas/sprint";
import { type GetSprintMembersUseCaseType } from "~/server/logic/sprint/GetSprintMembersUseCase";
import { ReorderUtil } from "~/shared/logic/project/ReorderTasksUtil";

export const useDeliveryChartReorder = ({
  members: initialMembers,
}: {
  members: GetSprintMembersUseCaseType;
}) => {
  const [localMembers, setLocalMembers] =
    useState<GetSprintMembersUseCaseType>(initialMembers);

  useEffect(() => {
    setLocalMembers(initialMembers);
  }, [initialMembers]);

  const updateTasksOrder = (sprintTask: UpdateSprintTaskOrderInputType) => {
    const updatedMembers = [...localMembers];

    // Find source task
    const sourceTask = updatedMembers
      .flatMap((m) => m.tasks)
      .find((t) => t.id === sprintTask.sprintTaskId);

    if (!sourceTask) return;

    // Remove task from all members
    updatedMembers.forEach((member) => {
      member.tasks = member.tasks.filter(
        (t) => t.id !== sprintTask.sprintTaskId
      );
    });

    // Add task to destination member
    if (sprintTask.sprintMemberId) {
      const destMember = updatedMembers.find(
        (m) => m.id === sprintTask.sprintMemberId
      );
      if (destMember) {
        // Use ReorderUtil to handle the task insertion at the correct order
        destMember.tasks = ReorderUtil(
          null,
          sprintTask.order,
          destMember.tasks,
          {
            ...sourceTask,
            sprintMemberId: sprintTask.sprintMemberId,
          }
        );
      }
    }

    setLocalMembers(updatedMembers);
    return updatedMembers;
  };

  const updateMembersOrder = (
    sprintMember: UpdateSprintMemberOrderInputType
  ) => {
    const updatedMembers = ReorderUtil(
      localMembers.find((m) => m.id === sprintMember.sprintMemberId)?.order ??
        0,
      sprintMember.order,
      localMembers,
      localMembers.find((m) => m.id === sprintMember.sprintMemberId)
    );

    setLocalMembers(updatedMembers);
    return updatedMembers;
  };

  return {
    localMembers,
    setLocalMembers,
    updateTasksOrder,
    updateMembersOrder,
  };
};
