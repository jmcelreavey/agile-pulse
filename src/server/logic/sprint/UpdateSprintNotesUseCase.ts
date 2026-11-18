import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class UpdateSprintNotesUseCase extends UseCase {
  async execute(input: { id: number; notes: string }) {
    try {
      const sprint = await this.db.sprint.update({
        where: { id: input.id },
        data: { ...input },
      });

      return sprint;
    } catch (error) {
      console.error(error);
      throw new RecordNotFoundError("Sprint not found");
    }
  }
}

export type UpdateSprintNotesType = getReturnType<UpdateSprintNotesUseCase>;
export type UpdateSprintNotesInput = Parameters<
  UpdateSprintNotesUseCase["execute"]
>[0];
