import { AssignSprintMemberUseCase } from "~/server/logic/sprint/AssignSprintMemberUseCase";
import { CreateSprintTaskUseCase } from "~/server/logic/sprint/CreateSprintTaskUseCase";
import { UnassignSprintTaskUseCase } from "~/server/logic/sprint/UnassignSprintTaskUseCase";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class MoveSprintTasksUseCase extends UseCase {
  async execute(input: {
    sourceSprintId: number;
    targetSprintId: number;
    sprintTaskIds: {
      sprintTaskId: number;
      memberId?: number;
    }[];
  }) {
    const unassignSprintTask = new UnassignSprintTaskUseCase(this.db);
    const assignSprintMember = new AssignSprintMemberUseCase(this.db);
    const createSprintTask = new CreateSprintTaskUseCase(this.db);

    const tasksMoved = [];
    for (const task of input.sprintTaskIds) {
      // Unassign the task from the source sprint
      const unassignedTask = await unassignSprintTask.execute({
        sprintTaskId: task.sprintTaskId,
        removeFromSprint: true,
      });

      // Assign the member if the task that was unassigned had one
      let sprintMember = null;
      if (task.memberId) {
        sprintMember = await assignSprintMember.execute({
          sprintId: input.targetSprintId,
          memberId: task.memberId,
        });
      }

      // Create the task with the new sprint member
      const createTask = await createSprintTask.execute({
        sprintId: input.targetSprintId,
        days: unassignedTask.days,
        sprintMemberId: sprintMember?.id ?? null,
        taskId: unassignedTask.taskId,
        order: unassignedTask.order,
      });

      tasksMoved.push(createTask);
    }

    return tasksMoved;
  }
}

export type MoveSprintTasksUseCaseType = getReturnType<MoveSprintTasksUseCase>;
export type MoveSprintTasksUseCaseInput = Parameters<
  MoveSprintTasksUseCase["execute"]
>[0];
