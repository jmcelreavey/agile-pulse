import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToProjectUseCase } from "~/app/logic/project/GoToProjectUseCase";
import { InvalidateProjectDataUseCase } from "~/app/logic/project/InvalidateProjectDataUseCase";
import { InvalidateSprintDataUseCase } from "~/app/logic/sprint/InvalidateSprintDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class ReopenSprintUseCase extends UseCase {
  protected mutation = api.sprint.reopen.useMutation();
  protected invalidateProjectData = new InvalidateProjectDataUseCase();
  protected invalidateSprintData = new InvalidateSprintDataUseCase();
  protected goToProject = new GoToProjectUseCase();

  public async execute({
    sprintId,
    reference,
  }: {
    sprintId: number;
    reference: string;
  }) {
    try {
      this.setIsMutating(true);
      await this.mutation.mutateAsync({
        id: sprintId,
        reference,
      });

      await this.invalidateProjectData.execute();
      await this.invalidateSprintData.execute();

      ShowNotificationUtil({
        title: `${reference ?? "Record"} reopened!`,
        message: `sprint ${reference} is now reopened`,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: `Error reopening sprint ${reference}`,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
