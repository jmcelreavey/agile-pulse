import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToProjectUseCase } from "~/app/logic/project/GoToProjectUseCase";
import { InvalidateProjectListDataUseCase } from "~/app/logic/project/InvalidateProjectListDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { type CreateProjectInput } from "~/server/logic/project/CreateProjectUseCase";
import { api } from "~/trpc/react";

export class CreateProjectUseCase extends UseCase {
  public mutation = api.project.create.useMutation();
  protected invalidateProjectListDataUseCase =
    new InvalidateProjectListDataUseCase();
  protected goToProject = new GoToProjectUseCase();

  public async execute({
    project,
    reference,
  }: {
    project: CreateProjectInput;
    reference: string;
  }) {
    try {
      this.setIsMutating(true);
      const newProject = await this.mutation.mutateAsync(project);

      await this.invalidateProjectListDataUseCase.execute();

      ShowNotificationUtil({
        title: `${reference ?? "Record"} created!`,
        message: `project ${reference} is now created`,
      });

      void this.goToProject.execute(newProject.id);
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
