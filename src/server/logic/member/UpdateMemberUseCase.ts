import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class UpdateMemberUseCase extends UseCase {
  async execute(input: { id: number; name: string }) {
    try {
      const member = await this.db.member.update({
        where: { id: input.id },
        data: input,
      });

      return member;
    } catch (error) {
      console.error(error);
      throw new RecordNotFoundError("Member not found");
    }
  }
}

export type UpdateMemberType = getReturnType<UpdateMemberUseCase>;
export type UpdateMemberInput = Parameters<UpdateMemberUseCase["execute"]>[0];
