import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { UseCase } from "~/app/logic/useCase";
import { type ChangelogTone } from "~/shared/types/changelog";
import { api } from "~/trpc/react";

interface SaveChangelogParams {
  sprintId: number;
  taskIds: number[];
  tone: ChangelogTone;
  content: string;
}

export class SaveChangelogUseCase extends UseCase {
  public mutation = api.changelog.save.useMutation();

  public async execute(params: SaveChangelogParams) {
    try {
      this.setIsMutating(true);
      const result = await this.mutation.mutateAsync(params);
      return result;
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error("Failed to save changelog:", error);
      ShowNotificationUtil({
        title: "Error",
        message: errorMessage || "Failed to save changelog",
        isError: true,
      });
      throw error;
    } finally {
      this.setIsMutating(false);
    }
  }
}
