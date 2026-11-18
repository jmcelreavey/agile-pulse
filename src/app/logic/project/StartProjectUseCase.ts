import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToProjectUseCase } from "~/app/logic/project/GoToProjectUseCase";
import { InvalidateProjectDataUseCase } from "~/app/logic/project/InvalidateProjectDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class StartProjectUseCase extends UseCase {
  public mutation = api.project.start.useMutation();
  protected invalidateProjectData = new InvalidateProjectDataUseCase();
  protected goToProject = new GoToProjectUseCase();

  public async execute({
    id,
    reference,
    startedAt,
  }: {
    id: number;
    reference: string;
    startedAt?: Date;
  }) {
    try {
      this.setIsMutating(true);
      await this.mutation.mutateAsync({
        id,
        startedAt,
      });

      await this.invalidateProjectData.execute();

      ShowNotificationUtil({
        title: `${reference ?? "Record"} started!`,
        message: `project ${reference} is now started`,
      });

      void this.goToProject.execute(id);
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: `Error starting project ${reference}`,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
