import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class UpdateProjectSharedNotesUseCase extends UseCase {
  async execute(input: { id: number; sharedNotes: string }) {
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

export type UpdateProjectSharedNotesType = getReturnType<UpdateProjectSharedNotesUseCase>;
export type UpdateProjectSharedNotesInput = Parameters<
  UpdateProjectSharedNotesUseCase["execute"]
>[0];
