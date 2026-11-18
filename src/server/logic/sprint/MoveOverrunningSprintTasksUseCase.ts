import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { GetOverrunningSprintTasksUseCase } from "~/server/logic/sprint/GetOverrunningSprintTasksUseCase";
import { MoveSprintTasksUseCase } from "~/server/logic/sprint/MoveSprintTasksUseCase";

export class MoveOverrunningSprintTasksUseCase extends UseCase {
  async execute(input: { sourceSprintId: number; targetSprintId: number }) {
    const getOverrunningSprintTasks = new GetOverrunningSprintTasksUseCase(
      this.db
    );
    const moveSprintTasks = new MoveSprintTasksUseCase(this.db);

    // Get overrunning tasks
    const overrunningTasks = await getOverrunningSprintTasks.execute({
      sprintId: input.sourceSprintId,
    });

    // Move overrunning tasks to the target sprint
    const movedTasks = await moveSprintTasks.execute({
      sourceSprintId: input.sourceSprintId,
      targetSprintId: input.targetSprintId,
      sprintTaskIds: overrunningTasks.map((task) => ({
        sprintTaskId: task.id,
        memberId: task.memberId,
      })),
    });

    return movedTasks;
  }
}

export type MoveOverrunningSprintTasksUseCaseType =
  getReturnType<MoveOverrunningSprintTasksUseCase>;
export type MoveOverrunningSprintTasksUseCaseInput = Parameters<
  MoveOverrunningSprintTasksUseCase["execute"]
>[0];
