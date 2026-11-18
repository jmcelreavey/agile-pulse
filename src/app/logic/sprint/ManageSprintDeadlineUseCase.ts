import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToSprintUseCase } from "~/app/logic/sprint/GoToSprintUseCase";
import { InvalidateSprintDataUseCase } from "~/app/logic/sprint/InvalidateSprintDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { type ManageSprintDeadlineInputType } from "~/server/api/schemas/sprint";
import { api } from "~/trpc/react";

export class ManageSprintDeadlineUseCase extends UseCase {
  protected invalidateSprintData = new InvalidateSprintDataUseCase();
  protected goToSprint = new GoToSprintUseCase();

  public mutation = api.sprint.manageDeadlines.useMutation();

  public async execute({
    sprintDeadline,
  }: {
    sprintDeadline: ManageSprintDeadlineInputType;
  }) {
    try {
      this.setIsMutating(true);
      await this.mutation.mutateAsync(sprintDeadline);

      await this.invalidateSprintData.execute();

      ShowNotificationUtil({
        title: `Sprint deadlines updated!`,
        message: `Deadlines updated.`,
        autoClose: 1000,
        withCloseButton: false,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: `Error updating sprint deadlines`,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
