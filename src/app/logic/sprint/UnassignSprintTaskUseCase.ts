import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToSprintUseCase } from "~/app/logic/sprint/GoToSprintUseCase";
import { InvalidateSprintDataUseCase } from "~/app/logic/sprint/InvalidateSprintDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { type UnassignSprintTaskInputType } from "~/server/api/schemas/sprint";
import { api } from "~/trpc/react";

export class UnassignSprintTaskUseCase extends UseCase {
  public mutation = api.sprint.unassignTask.useMutation();
  protected invalidateSprintData = new InvalidateSprintDataUseCase();
  protected goToSprint = new GoToSprintUseCase();

  public async execute({
    sprintTask,
    reference,
  }: {
    sprintTask: UnassignSprintTaskInputType;
    reference: string;
  }) {
    try {
      this.setIsMutating(true);
      const record = await this.mutation.mutateAsync(sprintTask);

      await this.invalidateSprintData.execute();

      ShowNotificationUtil({
        title: `${reference ?? "Record"} unassigned!`,
        message: `sprint task ${reference} is now unassigned`,
      });

      void this.goToSprint.execute(record.projectId, record.sprintId);
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: `Error unassigning sprint task ${reference}`,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
