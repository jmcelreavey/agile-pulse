import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class DeleteChangelogUseCase extends UseCase {
  public mutation = api.changelog.delete.useMutation();

  public async execute(id: number) {
    try {
      this.setIsMutating(true);
      await this.mutation.mutateAsync({ id });

      ShowNotificationUtil({
        title: "Success",
        message: "Changelog deleted successfully",
      });

      // Invalidate changelog queries
      await this.useUtils.changelog.getAll.invalidate();
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: "Error",
        message: errorMessage || "Failed to delete changelog",
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
