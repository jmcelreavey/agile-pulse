import { type getReturnType, UseCase } from "~/server/logic/useCase";
import { State } from "~/shared/types/State";

export class GetProjectSprintsUseCase extends UseCase {
  async execute(input: { projectId: number }) {
    const { projectId } = input;

    const sprints = await this.db.sprint.findMany({
      where: { projectId, snapshot: null },
      select: {
        id: true,
        reference: true,
        updatedAt: true,
        days: true,
        daysRemaining: true,
        state: true,
        completedAt: true,
        startedAt: true,
        jiraSprintId: true,
        lastSyncedAt: true,
        changelogs: {
          select: {
            id: true,
            sharedAt: true,
            sharedViaEmail: true,
            exportedToPdf: true,
            createdAt: true,
          },
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        },
        sprintTasks: {
          select: {
            id: true,
            task: {
              select: {
                state: true,
              },
            },
          },
        },
      },
    });

    return sprints.map((sprint) => {
      const { sprintTasks, changelogs, ...rest } = sprint;
      const latestChangelog = changelogs[0];

      return {
        ...rest,
        state: sprint.state as State,
        totalNotStartedTasks: sprintTasks.filter(
          (task) => (task.task.state as State) === State.NOT_STARTED
        ).length,
        totalInProgressTasks: sprintTasks.filter(
          (task) => (task.task.state as State) === State.IN_PROGRESS
        ).length,
        totalCompletedTasks: sprintTasks.filter(
          (task) => (task.task.state as State) === State.COMPLETED
        ).length,
        totalTasks: sprintTasks.length,
        changelog: latestChangelog
          ? {
              id: latestChangelog.id,
              hasChangelog: true,
              sharedAt: latestChangelog.sharedAt,
              sharedViaEmail: latestChangelog.sharedViaEmail,
              exportedToPdf: latestChangelog.exportedToPdf,
              createdAt: latestChangelog.createdAt,
            }
          : {
              hasChangelog: false,
              sharedAt: "",
              sharedViaEmail: false,
              exportedToPdf: false,
              createdAt: "",
            },
      };
    });
  }
}

export type GetProjectSprintsUseCaseType =
  getReturnType<GetProjectSprintsUseCase>;
export type GetProjectSprintsUseCaseInput = Parameters<
  GetProjectSprintsUseCase["execute"]
>[0];
