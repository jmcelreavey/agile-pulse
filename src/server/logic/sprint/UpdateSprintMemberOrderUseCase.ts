import { type UpdateSprintMemberOrderInputType } from "~/server/api/schemas/sprint";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import {
  GetSprintMembersUseCase,
  type GetSprintMembersUseCaseType,
} from "~/server/logic/sprint/GetSprintMembersUseCase";
import { type getReturnType, UseCase } from "~/server/logic/useCase";
import { ReorderUtil } from "~/shared/logic/project/ReorderTasksUtil";

export class UpdateSprintMemberOrderUseCase extends UseCase {
  async execute(input: UpdateSprintMemberOrderInputType) {
    const members = await new GetSprintMembersUseCase(this.db).execute({
      sprintId: input.sprintId,
    });

    const currentMember = members.find(
      (member) => member.id === input.sprintMemberId
    );

    if (!currentMember) {
      throw new RecordNotFoundError("Member not found");
    }

    await this.updateMemberOrder(
      members,
      currentMember.order,
      input.order,
      currentMember
    );

    return currentMember;
  }

  private async updateMemberOrder(
    members: GetSprintMembersUseCaseType,
    previousOrder: number | null,
    newOrder: number | null,
    currentMember: GetSprintMembersUseCaseType[0]
  ) {
    const updatedMembers = ReorderUtil<GetSprintMembersUseCaseType[0]>(
      previousOrder,
      newOrder,
      members,
      currentMember
    );

    const updatePromises = updatedMembers.map((member) =>
      this.db.sprintMember.update({
        where: { id: member.id },
        data: { order: member.order ?? undefined },
      })
    );

    await Promise.all(updatePromises);
  }
}

export type UpdateSprintMemberOrderUseCaseType =
  getReturnType<UpdateSprintMemberOrderUseCase>;
export type UpdateSprintMemberOrderUseCaseeInput = Parameters<
  UpdateSprintMemberOrderUseCase["execute"]
>[0];
