import { type getReturnType, UseCase } from "~/server/logic/useCase";

export class UnassignSprintDeadlineUseCase extends UseCase {
  async execute(input: { sprintDeadlineId: number }) {
    const sprintDeadline = await this.db.sprintDeadline.delete({
      where: {
        id: input.sprintDeadlineId,
      },
      select: {
        deadlineId: true,
        sprint: {
          select: {
            projectId: true,
            id: true,
          },
        },
      },
    });
    return {
      ...sprintDeadline,
      projectId: sprintDeadline.sprint.projectId,
      sprintId: sprintDeadline.sprint.id,
    };
  }
}

export type UnassignSprintDeadlineUseCaseType =
  getReturnType<UnassignSprintDeadlineUseCase>;
export type UnassignSprintDeadlineUseCaseInput = Parameters<
  UnassignSprintDeadlineUseCase["execute"]
>[0];
