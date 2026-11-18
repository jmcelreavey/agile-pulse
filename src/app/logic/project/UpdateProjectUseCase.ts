import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToProjectUseCase } from "~/app/logic/project/GoToProjectUseCase";
import { InvalidateProjectDataUseCase } from "~/app/logic/project/InvalidateProjectDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { type UpdateProjectInputType } from "~/server/api/schemas/project";
import { api } from "~/trpc/react";

export class UpdateProjectUseCase extends UseCase {
  public mutation = api.project.update.useMutation();
  protected invalidateProjectData = new InvalidateProjectDataUseCase();
  protected goToProject = new GoToProjectUseCase();

  public async execute({
    project,
    reference,
  }: {
    project: UpdateProjectInputType;
    reference: string;
  }) {
    try {
      this.setIsMutating(true);
      const record = await this.mutation.mutateAsync(project);

      await this.invalidateProjectData.execute();
      void this.goToProject.execute(record.id);

      ShowNotificationUtil({
        title: `${reference ?? "Record"} updated!`,
        message: `project ${reference} is now updated`,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: `Error completing project ${reference}`,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
