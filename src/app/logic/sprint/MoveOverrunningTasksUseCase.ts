import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { InvalidateSprintDataUseCase } from "~/app/logic/sprint/InvalidateSprintDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class MoveOverrunningTasksUseCase extends UseCase {
  protected mutation = api.sprint.moveOverrunningTasks.useMutation();
  protected invalidateSprintDataUseCase = new InvalidateSprintDataUseCase();

  public async execute({
    sourceSprintId,
    targetSprintId,
    sourceReference,
    targetReference,
  }: {
    sourceSprintId: number;
    targetSprintId: number;
    sourceReference: string;
    targetReference: string;
  }) {
    try {
      this.setIsMutating(true);
      const movedTasks = await this.mutation.mutateAsync({
        sourceSprintId,
        targetSprintId,
      });

      await this.invalidateSprintDataUseCase.execute();

      ShowNotificationUtil({
        title: "Tasks moved successfully!",
        message: `Overrunning tasks moved from ${sourceReference} to ${targetReference}`,
      });

      return movedTasks;
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: `Error moving overrunning tasks`,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
