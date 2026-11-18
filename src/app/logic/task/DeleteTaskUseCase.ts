import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class DeleteTaskUseCase extends UseCase {
  public mutation = api.sprint.deleteTask.useMutation();

  public async execute(id: number) {
    try {
      this.setIsMutating(true);
      await this.mutation.mutateAsync({ id });

      // Invalidate queries to refresh the UI
      await this.useUtils.sprint.getTasks.invalidate();
      await this.useUtils.sprint.getMembers.invalidate();
      await this.useUtils.sprint.getOne.invalidate();
      await this.useUtils.project.getOne.invalidate();
    } catch (error) {
      console.error("Failed to delete task:", error);
      throw error;
    } finally {
      this.setIsMutating(false);
    }
  }
}
