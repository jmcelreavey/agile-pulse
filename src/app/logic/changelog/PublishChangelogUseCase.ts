import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class PublishChangelogUseCase extends UseCase {
  public mutation = api.changelog.update.useMutation();

  public async execute(id: number, isPublished: boolean) {
    try {
      this.setIsMutating(true);
      await this.mutation.mutateAsync({
        id,
        isPublished: !isPublished,
      });

      ShowNotificationUtil({
        title: "Success",
        message: "Changelog published successfully",
      });

      // Invalidate changelog queries
      await this.useUtils.changelog.getAll.invalidate();
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: "Error",
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
