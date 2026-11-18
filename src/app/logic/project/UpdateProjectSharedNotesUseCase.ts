import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToProjectUseCase } from "~/app/logic/project/GoToProjectUseCase";
import { InvalidateProjectDataUseCase } from "~/app/logic/project/InvalidateProjectDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { type UpdateProjectSharedNotesInputType } from "~/server/api/schemas/project";
import { api } from "~/trpc/react";

export class UpdateProjectSharedNotesUseCase extends UseCase {
  protected invalidateProjectData = new InvalidateProjectDataUseCase();
  protected goToProject = new GoToProjectUseCase();

  public mutation = api.project.updateSharedNotes.useMutation();

  public async execute({
    projectSharedNotes,
  }: {
    projectSharedNotes: UpdateProjectSharedNotesInputType;
  }) {
    try {
      this.setIsMutating(true);
      await this.mutation.mutateAsync(projectSharedNotes);

      await this.invalidateProjectData.execute();

      ShowNotificationUtil({
        title: `Shared project notes updated!`,
        message: `Shared notes updated.`,
        autoClose: 1000,
        withCloseButton: false,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: "Failed to update shared notes",
        message: errorMessage,
        isError: true,
      });
      throw error;
    } finally {
      this.setIsMutating(false);
    }
  }
}
