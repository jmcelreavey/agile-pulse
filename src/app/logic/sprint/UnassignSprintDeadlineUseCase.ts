import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToSprintUseCase } from "~/app/logic/sprint/GoToSprintUseCase";
import { InvalidateSprintDataUseCase } from "~/app/logic/sprint/InvalidateSprintDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { type UnassignSprintDeadlineInputType } from "~/server/api/schemas/sprint";
import { api } from "~/trpc/react";

export class UnassignSprintDeadlineUseCase extends UseCase {
  public mutation = api.sprint.unassignDeadline.useMutation();
  protected invalidateSprintData = new InvalidateSprintDataUseCase();
  protected goToSprint = new GoToSprintUseCase();

  public async execute({
    sprintDeadline,
    reference,
  }: {
    sprintDeadline: UnassignSprintDeadlineInputType;
    reference: string;
  }) {
    try {
      this.setIsMutating(true);
      const record = await this.mutation.mutateAsync(sprintDeadline);

      await this.invalidateSprintData.execute();

      ShowNotificationUtil({
        title: `${reference ?? "Record"} unassigned!`,
        message: `sprint deadline ${reference} is now unassigned`,
      });

      void this.goToSprint.execute(record.projectId, record.sprintId);
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: `Error unassigning sprint deadline ${reference}`,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
