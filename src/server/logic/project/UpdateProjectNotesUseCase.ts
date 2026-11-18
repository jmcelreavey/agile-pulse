import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class UpdateProjectNotesUseCase extends UseCase {
  async execute(input: { id: number; notes: string }) {
    try {
      const project = await this.db.project.update({
        where: { id: input.id },
        data: { ...input },
      });

      return project;
    } catch (error) {
      console.error(error);
      throw new RecordNotFoundError("Project not found");
    }
  }
}

export type UpdateProjectNotesType = getReturnType<UpdateProjectNotesUseCase>;
export type UpdateProjectNotesInput = Parameters<
  UpdateProjectNotesUseCase["execute"]
>[0];
