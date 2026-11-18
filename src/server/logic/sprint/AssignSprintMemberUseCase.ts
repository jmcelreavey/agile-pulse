import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class AssignSprintMemberUseCase extends UseCase {
  async execute(input: { sprintId: number; memberId: number; order?: number }) {
    let order = input.order;
    if (!order) {
      order = await this.getMaxOrder(input.sprintId);
    }

    const sprintMember = await this.db.sprintMember.findFirst({
      where: {
        sprintId: input.sprintId,
        memberId: input.memberId,
      },
    });

    if (sprintMember) {
      return sprintMember;
    } else {
      return await this.db.sprintMember.create({
        data: {
          memberId: input.memberId,
          sprintId: input.sprintId,
          order,
        },
      });
    }
  }
  getMaxOrder = async (sprintId: number) => {
    const maxOrder = await this.db.sprintMember.findFirst({
      where: {
        sprintId,
      },
      orderBy: {
        order: "desc",
      },
    });

    return maxOrder ? maxOrder.order + 1 : 1;
  };
}

export type AssignMemberUseCaseType = getReturnType<AssignSprintMemberUseCase>;
export type AssignMemberUseCaseInput = Parameters<
  AssignSprintMemberUseCase["execute"]
>[0];
