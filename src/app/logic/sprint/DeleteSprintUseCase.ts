import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToProjectUseCase } from "~/app/logic/project/GoToProjectUseCase";
import { InvalidateProjectDataUseCase } from "~/app/logic/project/InvalidateProjectDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class DeleteSprintUseCase extends UseCase {
  protected mutation = api.sprint.delete.useMutation();
  protected invalidateProjectDataUseCase = new InvalidateProjectDataUseCase();
  protected goToProjectUseCase = new GoToProjectUseCase();

  public async execute({
    sprintId,
    reference,
  }: {
    sprintId: number;
    reference: string;
  }) {
    try {
      this.setIsMutating(true);
      const deletedRecord = await this.mutation.mutateAsync({
        id: sprintId,
      });

      await this.invalidateProjectDataUseCase.execute();

      ShowNotificationUtil({
        title: `${reference ?? "Record"} deleted!`,
        message: `sprint ${reference} is now deleted`,
      });

      void this.goToProjectUseCase.execute(deletedRecord.projectId);
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: `Error archiving sprint ${reference}`,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
