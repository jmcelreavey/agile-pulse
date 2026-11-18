import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToProjectUseCase } from "~/app/logic/project/GoToProjectUseCase";
import { InvalidateProjectDataUseCase } from "~/app/logic/project/InvalidateProjectDataUseCase";
import { InvalidateSprintDataUseCase } from "~/app/logic/sprint/InvalidateSprintDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class CompleteSprintUseCase extends UseCase {
  protected mutation = api.sprint.complete.useMutation();
  protected invalidateProjectData = new InvalidateProjectDataUseCase();
  protected invalidateSprintData = new InvalidateSprintDataUseCase();
  protected goToProject = new GoToProjectUseCase();

  public async execute({
    sprintId,
    reference,
    completedAt,
  }: {
    sprintId: number;
    reference: string;
    completedAt?: Date;
  }) {
    try {
      this.setIsMutating(true);
      const sprint = await this.mutation.mutateAsync({
        id: sprintId,
        completedAt,
      });

      await this.invalidateProjectData.execute();
      await this.invalidateSprintData.execute();

      ShowNotificationUtil({
        title: `${reference ?? "Record"} completed!`,
        message: `sprint ${reference} is now completed`,
      });

      void this.goToProject.execute(sprint.projectId);
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: `Error completing sprint ${reference}`,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
