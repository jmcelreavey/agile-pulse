import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToSprintUseCase } from "~/app/logic/sprint/GoToSprintUseCase";
import { InvalidateSprintDataUseCase } from "~/app/logic/sprint/InvalidateSprintDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { type UpdateSprintInputType } from "~/server/api/schemas/sprint";
import { api } from "~/trpc/react";

export class UpdateSprintUseCase extends UseCase {
  public mutation = api.sprint.update.useMutation();
  protected invalidateSprintData = new InvalidateSprintDataUseCase();
  protected goToSprint = new GoToSprintUseCase();

  public async execute({
    sprint,
    reference,
  }: {
    sprint: UpdateSprintInputType;
    reference: string;
  }) {
    try {
      this.setIsMutating(true);
      const record = await this.mutation.mutateAsync(sprint);

      await this.invalidateSprintData.execute();
      void this.goToSprint.execute(record.projectId, record.id);

      ShowNotificationUtil({
        title: `${reference ?? "Record"} updated!`,
        message: `sprint ${reference} is now updated`,
      });
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
