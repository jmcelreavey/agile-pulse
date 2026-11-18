import { type UpdateSprintTaskOrderInputType } from "~/server/api/schemas/sprint";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import {
  GetSprintTasksUseCase,
  type GetSprintTasksUseCaseType,
} from "~/server/logic/sprint/GetSprintTasksUseCase";
import { type getReturnType, UseCase } from "~/server/logic/useCase";
import { ReorderUtil } from "~/shared/logic/project/ReorderTasksUtil";

export class UpdateSprintTaskOrderUseCase extends UseCase {
  async execute(input: UpdateSprintTaskOrderInputType) {
    const tasks = await new GetSprintTasksUseCase(this.db).execute({
      sprintId: input.sprintId,
    });

    const currentTask = tasks.find((task) => task.id === input.sprintTaskId);

    if (!currentTask) {
      throw new RecordNotFoundError("Task not found");
    }

    const hasChangedMember =
      currentTask.sprintMemberId !== input.sprintMemberId;

    // Work out every row's new position first, then write them in one batch. D1 has no
    // interactive transactions, but it does run a batch of statements atomically.
    const updates: { id: number; order: number; sprintMemberId: number }[] = [];
    if (hasChangedMember) {
      if (currentTask.sprintMemberId) {
        // Moving from a member to unassigned or another member
        updates.push(...this.memberTaskOrder(currentTask.sprintMemberId, tasks, currentTask.order, null, currentTask));
      }
      if (input.sprintMemberId) {
        updates.push(...this.memberTaskOrder(input.sprintMemberId, tasks, null, input.order, currentTask));
      }
    } else if (currentTask.sprintMemberId) {
      updates.push(...this.memberTaskOrder(currentTask.sprintMemberId, tasks, currentTask.order, input.order, currentTask));
    }

    if (updates.length) {
      await this.db.$transaction(
        updates.map((task) =>
          this.db.sprintTask.update({
            where: { id: task.id },
            data: { order: task.order, sprintMemberId: task.sprintMemberId },
          })
        )
      );
    }

    return currentTask;
  }

  private memberTaskOrder(
    sprintMemberId: number,
    tasks: GetSprintTasksUseCaseType,
    previousOrder: number | null,
    newOrder: number | null,
    currentTask?: GetSprintTasksUseCaseType[0]
  ) {
    const memberTasks = tasks.filter((task) => task.sprintMemberId === sprintMemberId);
    return ReorderUtil(previousOrder, newOrder, memberTasks, currentTask).map((task) => ({
      id: task.id,
      order: task.order,
      sprintMemberId,
    }));
  }
}

export type UpdateSprintTaskOrderUseCaseType =
  getReturnType<UpdateSprintTaskOrderUseCase>;
export type UpdateSprintTaskOrderUseCaseInput = Parameters<
  UpdateSprintTaskOrderUseCase["execute"]
>[0];
