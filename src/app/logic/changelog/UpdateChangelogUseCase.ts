import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { UseCase } from "~/app/logic/useCase";
import { type ChangelogTone } from "~/shared/types/changelog";
import { api } from "~/trpc/react";

interface UpdateChangelogParams {
  id: number;
  content?: string;
  tone?: ChangelogTone;
  isPublished?: boolean;
}

export class UpdateChangelogUseCase extends UseCase {
  public mutation = api.changelog.update.useMutation();

  public async execute(params: UpdateChangelogParams, onSuccess?: () => void) {
    try {
      this.setIsMutating(true);
      await this.mutation.mutateAsync(params);

      ShowNotificationUtil({
        title: "Success",
        message: "Changelog updated successfully",
      });

      // Invalidate changelog queries
      await this.useUtils.changelog.getAll.invalidate();
      await this.useUtils.changelog.getOne.invalidate();

      onSuccess?.();
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
