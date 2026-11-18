import { type getReturnType, UseCase } from "~/server/logic/useCase";

export class UnassignSprintTaskUseCase extends UseCase {
  async execute(input: { sprintTaskId: number; removeFromSprint?: boolean }) {
    const sprintTask = await this.db.sprintTask.update({
      where: {
        id: input.sprintTaskId,
      },
      data: {
        sprintMemberId: null,
      },
      select: {
        id: true,
        order: true,
        taskId: true,
        sprint: {
          select: {
            projectId: true,
            id: true,
          },
        },
        days: true,
        sprintMember: {
          select: {
            id: true,
            memberId: true,
          },
        },
      },
    });

    if (input.removeFromSprint) {
      await this.db.sprintTask.delete({
        where: {
          id: input.sprintTaskId,
        },
      });
    }

    return {
      ...sprintTask,
      projectId: sprintTask.sprint.projectId,
      sprintId: sprintTask.sprint.id,
      memberId: sprintTask.sprintMember?.memberId,
      sprintMemberId: sprintTask.sprintMember?.id,
    };
  }

  getMaxOrder = async (sprintId: number, sprintMemberId: number | null) => {
    const maxOrder = await this.db.sprintTask.findFirst({
      where: {
        sprintId,
        sprintMemberId,
      },
      orderBy: {
        order: "desc",
      },
    });

    return maxOrder ? maxOrder.order + 1 : 1;
  };
}

export type UnassignSprintTaskUseCaseType =
  getReturnType<UnassignSprintTaskUseCase>;
export type UnassignSprintTaskUseCaseInput = Parameters<
  UnassignSprintTaskUseCase["execute"]
>[0];
