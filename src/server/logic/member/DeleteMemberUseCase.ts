import { type DeleteMemberInputType } from "~/server/api/schemas/member";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import {
  UseCase,
  type getInputType,
  type getReturnType,
} from "~/server/logic/useCase";

export class DeleteMemberUseCase extends UseCase {
  async execute(input: DeleteMemberInputType & { deletedRecordId: number }) {
    try {
      const deletedRecord = await this.db.member.update({
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

export type DeleteMemberType = getReturnType<DeleteMemberUseCase>;
export type DeleteMemberInput = getInputType<DeleteMemberUseCase>;
