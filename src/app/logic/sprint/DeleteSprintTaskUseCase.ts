import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { InvalidateSprintDataUseCase } from "~/app/logic/sprint/InvalidateSprintDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class DeleteSprintTaskUseCase extends UseCase {
  protected mutation = api.sprint.deleteTask.useMutation();
  protected invalidateData = new InvalidateSprintDataUseCase();

  public async execute({
    sprintMemberId,
    reference,
  }: {
    sprintMemberId: number;
    reference: string;
  }) {
    try {
      this.setIsMutating(true);
      await this.mutation.mutateAsync({
        id: sprintMemberId,
      });

      await this.invalidateData.execute();

      ShowNotificationUtil({
        title: `${reference ?? "Record"} deleted!`,
        message: `sprint member ${reference} is now deleted`,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: `Error archiving sprint member ${reference}`,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
