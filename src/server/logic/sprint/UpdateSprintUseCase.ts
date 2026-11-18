import { type UpdateSprintInputType } from "~/server/api/schemas/sprint";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class UpdateSprintUseCase extends UseCase {
  async execute(input: UpdateSprintInputType) {
    try {
      const sprint = await this.db.sprint.update({
        where: { id: input.id },
        data: input,
        select: {
          id: true,
          reference: true,
          state: true,
          days: true,
          projectId: true,
        },
      });

      return sprint;
    } catch (error) {
      console.error(error);
      throw new RecordNotFoundError("Sprint not found");
    }
  }
}

export type UpdateSprintUseCaseType = getReturnType<UpdateSprintUseCase>;
export type UpdateSprintUseCaseInput = Parameters<
  UpdateSprintUseCase["execute"]
>[0];
