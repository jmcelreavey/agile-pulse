import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToProjectUseCase } from "~/app/logic/project/GoToProjectUseCase";
import { InvalidateProjectDataUseCase } from "~/app/logic/project/InvalidateProjectDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { type UpdateProjectNotesInputType } from "~/server/api/schemas/project";
import { api } from "~/trpc/react";

export class UpdateProjectNotesUseCase extends UseCase {
  protected invalidateProjectData = new InvalidateProjectDataUseCase();
  protected goToProject = new GoToProjectUseCase();

  public mutation = api.project.updateNotes.useMutation();

  public async execute({
    projectNotes,
  }: {
    projectNotes: UpdateProjectNotesInputType;
  }) {
    try {
      this.setIsMutating(true);
      await this.mutation.mutateAsync(projectNotes);

      await this.invalidateProjectData.execute();

      ShowNotificationUtil({
        title: `Project notes updated!`,
        message: `Notes updated.`,
        autoClose: 1000,
        withCloseButton: false,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: `Error updating project notes`,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
