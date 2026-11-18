import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class UnassignTaskUseCase extends UseCase {
  public mutation = api.sprint.unassignTask.useMutation();

  public async execute(sprintTaskId: number) {
    try {
      this.setIsMutating(true);
      await this.mutation.mutateAsync({ sprintTaskId });

      // Invalidate queries to refresh the UI
      await this.useUtils.sprint.getTasks.invalidate();
      await this.useUtils.sprint.getMembers.invalidate();
      await this.useUtils.sprint.getOne.invalidate();
    } catch (error) {
      console.error("Failed to unassign task:", error);
      throw error;
    } finally {
      this.setIsMutating(false);
    }
  }
}
