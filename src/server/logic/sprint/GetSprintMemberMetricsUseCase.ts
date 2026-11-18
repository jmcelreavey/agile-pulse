import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { SprintSnapShotSource } from "~/shared/types/SnapshotSource";
import { State } from "~/shared/types/State";

export class GetSprintMemberMetricsUseCase extends UseCase {
  async execute({ sprintId }: { sprintId: number }) {
    const sprint = await this.db.sprint.findUnique({
      where: {
        id: sprintId,
      },
    });

    const sprintEndSnapshot = await this.db.snapshot.findFirst({
      where: {
        sourceId: sprintId,
      },
      include: {
        sprintMembers: {
          include: {
            member: true,
            sprintTasks: {
              include: {
                task: true,
              },
              where: {
                task: {
                  state: State.COMPLETED,
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const sprintStartSnapshot = await this.db.snapshot.findFirst({
      where: {
        sourceId: sprintId,
        source: SprintSnapShotSource.SPRINT_STARTED,
      },
      include: {
        sprintMembers: {
          include: {
            member: true,
            sprintTasks: {
              include: {
                task: true,
              },
            },
          },
        },
      },
    });

    if (!sprint) {
      throw new RecordNotFoundError("Sprint not found");
    }

    if (!sprintStartSnapshot) {
      return [];
    }

    const elapsedDays = sprint.days - sprint.daysRemaining;

    /**
     * Each member's performance is calculated by looking at how many tasks they
     * started with and how many they completed when the sprint ended.
     * We also take into consideration the length of the sprint to calculate the
     * tasks completed per day.
     */
    const sprintMembersEnd = sprintEndSnapshot?.sprintMembers.map((member) => {
      const totalCompleteTasks = member.sprintTasks.length;

      return {
        totalCompleteTasks,
        tasksCompletePerDay: totalCompleteTasks / elapsedDays,
        memberName: member.member.name,
      };
    });

    const sprintMembersFull = sprintStartSnapshot.sprintMembers
      .map((member) => {
        const totalPlannedTasks = member.sprintTasks.length;

        const endMember = sprintMembersEnd?.find(
          (endMember) => endMember.memberName === member.member.name
        );

        const totalCompleteTasks = endMember?.totalCompleteTasks ?? 0;
        const tasksCompletePerDay =
          elapsedDays > 0 ? totalCompleteTasks / elapsedDays : 0;
        const tasksPlannedPerDay =
          elapsedDays > 0 ? totalPlannedTasks / elapsedDays : 0;

        // Only return the record if at least one value is non-zero
        if (
          totalPlannedTasks > 0 ||
          totalCompleteTasks > 0 ||
          tasksCompletePerDay > 0 ||
          tasksPlannedPerDay > 0
        ) {
          return {
            name: member.member.name,
            totalPlannedTasks,
            tasksPlannedPerDay: tasksPlannedPerDay.toFixed(2),
            tasksCompletePerDay: tasksCompletePerDay.toFixed(2),
            totalCompleteTasks,
          };
        }
        return null;
      })
      .filter(Boolean); // Remove null entries

    return sprintMembersFull;
  }
}

export type GetSprintMemberMetricsUseCaseType =
  getReturnType<GetSprintMemberMetricsUseCase>;
export type GetSprintMemberMetricsUseCaseInput = Parameters<
  GetSprintMemberMetricsUseCase["execute"]
>[0];
