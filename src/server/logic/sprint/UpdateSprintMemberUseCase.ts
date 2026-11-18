import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class UpdateSprintMemberUseCase extends UseCase {
  async execute(input: {
    sprintMemberId: number;
    order?: number;
    name: string;
  }) {
    const updatedMember = await this.db.sprintMember.update({
      where: {
        id: input.sprintMemberId,
      },
      data: {
        order: input.order,
        member: {
          update: {
            name: input.name,
          },
        },
      },
      select: {
        member: {
          select: {
            id: true,
            name: true,
          },
        },
        id: true,
        sprint: {
          select: {
            id: true,
            projectId: true,
          },
        },
      },
    });

    return {
      id: updatedMember.id,
      name: updatedMember.member.name,
      projectId: updatedMember.sprint.projectId,
      sprintId: updatedMember.sprint.id,
    };
  }
}

export type UpdateSprintMemberUseCaseType =
  getReturnType<UpdateSprintMemberUseCase>;
export type UpdateSprintMemberUseCaseInput = Parameters<
  UpdateSprintMemberUseCase["execute"]
>[0];
