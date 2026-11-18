import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToProjectListUseCase } from "~/app/logic/project/GoToProjectListUseCase";
import { InvalidateProjectListDataUseCase } from "~/app/logic/project/InvalidateProjectListDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class ReopenProjectUseCase extends UseCase {
  protected mutation = api.project.reopen.useMutation();
  protected invalidateProjectListDataUseCase =
    new InvalidateProjectListDataUseCase();
  protected goToProjectListUseCase = new GoToProjectListUseCase();

  public async execute({
    projectId,
    reference,
  }: {
    projectId: number;
    reference: string;
  }) {
    try {
      this.setIsMutating(true);
      await this.mutation.mutateAsync({
        id: projectId,
      });

      await this.invalidateProjectListDataUseCase.execute();

      ShowNotificationUtil({
        title: `${reference ?? "Record"} reopened!`,
        message: `project ${reference} is now reopened`,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: `Error reopening project ${reference}`,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
