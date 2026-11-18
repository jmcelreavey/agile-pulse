import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToSprintUseCase } from "~/app/logic/sprint/GoToSprintUseCase";
import { InvalidateSprintDataUseCase } from "~/app/logic/sprint/InvalidateSprintDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class UpstartSprintUseCase extends UseCase {
  protected mutation = api.sprint.upstart.useMutation();
  protected invalidateSprintData = new InvalidateSprintDataUseCase();
  protected goToSprint = new GoToSprintUseCase();

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
      const sprint = await this.mutation.mutateAsync({
        id,
        startedAt,
      });

      await this.invalidateSprintData.execute();

      ShowNotificationUtil({
        title: `${reference ?? "Record"} started!`,
        message: `sprint ${reference} is now started`,
      });

      void this.goToSprint.execute(sprint.projectId, sprint.id);
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: `Error starting sprint ${reference}`,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
