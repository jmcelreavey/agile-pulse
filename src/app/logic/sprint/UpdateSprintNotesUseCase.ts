import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToSprintUseCase } from "~/app/logic/sprint/GoToSprintUseCase";
import { InvalidateSprintDataUseCase } from "~/app/logic/sprint/InvalidateSprintDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { type UpdateSprintNotesInputType } from "~/server/api/schemas/sprint";
import { api } from "~/trpc/react";

export class UpdateSprintNotesUseCase extends UseCase {
  protected invalidateSprintData = new InvalidateSprintDataUseCase();
  protected goToSprint = new GoToSprintUseCase();

  public mutation = api.sprint.updateNotes.useMutation();

  public async execute({
    sprintNotes,
  }: {
    sprintNotes: UpdateSprintNotesInputType;
  }) {
    try {
      this.setIsMutating(true);
      await this.mutation.mutateAsync(sprintNotes);

      await this.invalidateSprintData.execute();

      ShowNotificationUtil({
        title: `Sprint notes updated!`,
        message: `Notes updated.`,
        autoClose: 1000,
        withCloseButton: false,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: `Error updating sprint notes`,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
