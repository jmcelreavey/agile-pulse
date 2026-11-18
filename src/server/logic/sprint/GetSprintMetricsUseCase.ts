import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { State } from "~/shared/types/State";

export class GetSprintMetricsUseCase extends UseCase {
  async execute({ sprintId }: { sprintId: number }) {
    let metrics = {
      tasksCompletePerDay: 0,
      tasksPlannedPerDay: 0,
      totalTasksComplete: 0,
      totalTasksPlanned: 0,
    };
    const sprint = await this.db.sprint.findUnique({
      where: {
        id: sprintId,
      },
      include: {
        sprintTasks: {
          include: {
            task: true,
          },
        },
      },
    });

    if (!sprint) {
      throw new RecordNotFoundError("Sprint not found");
    }

    const elapsedDays = sprint.days - sprint.daysRemaining;

    metrics = sprint.sprintTasks.reduce((acc, sprintTask) => {
      if ((sprintTask.task.state as State) === State.COMPLETED) {
        acc.totalTasksComplete += 1;
      }
      acc.totalTasksPlanned += 1;
      return acc;
    }, metrics);

    metrics.tasksCompletePerDay = parseFloat(
      (metrics.totalTasksComplete / elapsedDays).toFixed(2)
    );
    metrics.tasksPlannedPerDay = parseFloat(
      (metrics.totalTasksPlanned / sprint.days).toFixed(2)
    );

    return metrics;
  }
}

export type GetSprintMetricsUseCaseType =
  getReturnType<GetSprintMetricsUseCase>;
export type GetSprintMetricsUseCaseInput = Parameters<
  GetSprintMetricsUseCase["execute"]
>[0];
