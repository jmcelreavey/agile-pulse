import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class GetOneMemberUseCase extends UseCase {
  async execute(input: { id: number }) {
    const member = await this.db.member.findUnique({
      where: { id: input.id },
    });

    if (!member) {
      throw new RecordNotFoundError("Member not found");
    }

    return member;
  }
}

export type GetOneMemberUseCaseType = getReturnType<GetOneMemberUseCase>;
export type GetOneMemberUseCaseInput = Parameters<
  GetOneMemberUseCase["execute"]
>[0];
