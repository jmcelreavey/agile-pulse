import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToProjectListUseCase } from "~/app/logic/project/GoToProjectListUseCase";
import { InvalidateProjectListDataUseCase } from "~/app/logic/project/InvalidateProjectListDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class CompleteProjectUseCase extends UseCase {
  protected mutation = api.project.complete.useMutation();
  protected invalidateProjectListDataUseCase =
    new InvalidateProjectListDataUseCase();
  protected goToProjectListUseCase = new GoToProjectListUseCase();

  public async execute({
    projectId,
    reference,
    completedAt,
  }: {
    projectId: number;
    reference: string;
    completedAt?: Date;
  }) {
    try {
      this.setIsMutating(true);
      await this.mutation.mutateAsync({
        id: projectId,
        completedAt,
      });

      await this.invalidateProjectListDataUseCase.execute();

      ShowNotificationUtil({
        title: `${reference ?? "Record"} completed!`,
        message: `project ${reference} is now completed`,
      });

      void this.goToProjectListUseCase.execute();
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
