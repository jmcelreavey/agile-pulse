import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import {
  UseCase,
  type getInputType,
  type getReturnType,
} from "~/server/logic/useCase";

export class DeleteSprintMemberUseCase extends UseCase {
  async execute(input: { id: number; deletedRecordId: number }) {
    try {
      // First unassign all tasks from this member
      await this.db.sprintTask.updateMany({
        where: { sprintMemberId: input.id },
        data: {
          sprintMemberId: null,
        },
      });

      // Then delete the member
      const deletedRecord = await this.db.sprintMember.update({
        where: { id: input.id },
        data: {
          deletedRecordId: input.deletedRecordId,
        },
        select: { id: true },
      });

      return deletedRecord;
    } catch (error) {
      console.error(error);
      throw new RecordNotFoundError("Member not found");
    }
  }
}

export type DeleteSprintMemberUseCaseType =
  getReturnType<DeleteSprintMemberUseCase>;
export type DeleteSprintMemberUseCaseInput =
  getInputType<DeleteSprintMemberUseCase>;
