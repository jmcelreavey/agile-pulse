import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToSprintUseCase } from "~/app/logic/sprint/GoToSprintUseCase";
import { InvalidateSprintDataUseCase } from "~/app/logic/sprint/InvalidateSprintDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class ProgressSprintUseCase extends UseCase {
  public mutation = api.sprint.progress.useMutation();
  protected invalidateSprintData = new InvalidateSprintDataUseCase();
  protected goToSprint = new GoToSprintUseCase();

  public async execute({
    sprintId,
    reference,
  }: {
    sprintId: number;
    reference: string;
  }) {
    try {
      this.setIsMutating(true);
      const sprint = await this.mutation.mutateAsync({
        id: sprintId,
      });

      await this.invalidateSprintData.execute();

      ShowNotificationUtil({
        title: `${reference ?? "Record"} progressed!`,
        message: `sprint ${reference} is now progressed`,
      });

      void this.goToSprint.execute(sprint.projectId, sprint.id);
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: `Error progressing sprint ${reference}`,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
