import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { GetSprintTasksUseCase } from "~/server/logic/sprint/GetSprintTasksUseCase";

export class GetOverrunningSprintTasksUseCase extends UseCase {
  async execute(input: { sprintId: number }) {
    const getSprintTasks = new GetSprintTasksUseCase(this.db);
    const tasks = await getSprintTasks.execute({ sprintId: input.sprintId });

    const sprint = await this.db.sprint.findUnique({
      where: { id: input.sprintId },
      select: { days: true },
    });

    if (!sprint) {
      throw new Error("Sprint not found");
    }

    // Sort tasks by member order and then by task order
    const sortedTasks = tasks
      .filter((task) => task.assignedTo !== "Unassigned")
      .sort((a, b) => {
        // Assuming each task has a memberOrder property
        if (a.memberOrder !== b.memberOrder) {
          return (a.memberOrder ?? 0) - (b.memberOrder ?? 0);
        }
        return a.order - b.order;
      });

    const overrunningTasks = [];
    let currentMember = null;
    let currentDay = 0;

    for (const task of sortedTasks) {
      if (currentMember !== task.assignedTo) {
        currentMember = task.assignedTo;
        currentDay = 0;
      }

      currentDay += task.days;
      if (currentDay > sprint.days) {
        overrunningTasks.push(task);
      }
    }

    return overrunningTasks;
  }
}

export type GetOverrunningSprintTasksUseCaseType =
  getReturnType<GetOverrunningSprintTasksUseCase>;
export type GetOverrunningSprintTasksUseCaseInput = Parameters<
  GetOverrunningSprintTasksUseCase["execute"]
>[0];
