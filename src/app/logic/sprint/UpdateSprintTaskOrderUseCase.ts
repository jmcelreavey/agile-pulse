import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToSprintUseCase } from "~/app/logic/sprint/GoToSprintUseCase";
import { InvalidateSprintDataUseCase } from "~/app/logic/sprint/InvalidateSprintDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { type UpdateSprintTaskOrderInputType } from "~/server/api/schemas/sprint";
import { api } from "~/trpc/react";

export class UpdateSprintTaskOrderUseCase extends UseCase {
  protected invalidateSprintData = new InvalidateSprintDataUseCase();
  protected goToSprint = new GoToSprintUseCase();

  public mutation = api.sprint.updateSprintTaskOrder.useMutation();

  public async execute({
    sprintTask,
  }: {
    sprintTask: UpdateSprintTaskOrderInputType;
  }) {
    try {
      this.setIsMutating(true);
      await this.mutation.mutateAsync(sprintTask);

      await this.invalidateSprintData.execute();

      ShowNotificationUtil({
        title: `Sprint task updated!`,
        message: `Task moved.`,
        autoClose: 1000,
        withCloseButton: false,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: `Error moving sprint task ${sprintTask.sprintTaskId}`,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
