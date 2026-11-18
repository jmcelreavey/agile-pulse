import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class CreateMemberUseCase extends UseCase {
  async execute(input: { name: string }) {
    const member = await this.db.member.create({
      data: input,
      select: {
        id: true,
        name: true,
      },
    });

    return member;
  }
}

export type CreateMemberType = getReturnType<CreateMemberUseCase>;
export type CreateMemberInput = Parameters<CreateMemberUseCase["execute"]>[0];
