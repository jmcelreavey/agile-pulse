import { type PrismaClient } from "~/generated/prisma/client";
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

    // Start a transaction to ensure order updates are atomic
    return await this.db.$transaction(async (tx) => {
      if (hasChangedMember) {
        if (currentTask.sprintMemberId) {
          // Moving from a member to unassigned or another member
          await this.updateMemberTasksOrder(
            currentTask.sprintMemberId,
            tasks,
            currentTask.order,
            null,
            currentTask,
            tx as PrismaClient
          );
        }

        // Update new member tasks order
        if (input.sprintMemberId) {
          await this.updateMemberTasksOrder(
            input.sprintMemberId,
            tasks,
            null,
            input.order,
            currentTask,
            tx as PrismaClient
          );
        }
      } else if (currentTask.sprintMemberId) {
        await this.updateMemberTasksOrder(
          currentTask.sprintMemberId,
          tasks,
          currentTask.order,
          input.order,
          currentTask,
          tx as PrismaClient
        );
      }

      return currentTask;
    });
  }

  private async updateMemberTasksOrder(
    sprintMemberId: number,
    tasks: GetSprintTasksUseCaseType,
    previousOrder: number | null,
    newOrder: number | null,
    currentTask?: GetSprintTasksUseCaseType[0],
    tx?: PrismaClient
  ) {
    const memberTasks = tasks.filter(
      (task) => task.sprintMemberId === sprintMemberId
    );

    const updatedTasks = ReorderUtil(
      previousOrder,
      newOrder,
      memberTasks,
      currentTask
    );

    // Use transaction if provided
    const db = tx ?? this.db;

    // Update all tasks in a single transaction
    const updatePromises = updatedTasks.map((task) =>
      db.sprintTask.update({
        where: { id: task.id },
        data: {
          order: task.order,
          sprintMemberId: sprintMemberId,
        },
      })
    );

    await Promise.all(updatePromises);
  }
}

export type UpdateSprintTaskOrderUseCaseType =
  getReturnType<UpdateSprintTaskOrderUseCase>;
export type UpdateSprintTaskOrderUseCaseInput = Parameters<
  UpdateSprintTaskOrderUseCase["execute"]
>[0];
