import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { UseCase } from "~/app/logic/useCase";
import { type ChangelogTone } from "~/shared/types/changelog";
import { api } from "~/trpc/react";

interface GenerateChangelogParams {
  sprintId: number;
  taskIds: number[];
  tone: ChangelogTone;
}

export class GenerateChangelogUseCase extends UseCase {
  public mutation = api.changelog.generate.useMutation();

  public async execute(params: GenerateChangelogParams) {
    try {
      this.setIsMutating(true);
      const result = await this.mutation.mutateAsync(params);
      return result;
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error("Failed to generate changelog:", error);
      ShowNotificationUtil({
        title: "Error",
        message: errorMessage || "Failed to generate changelog",
        isError: true,
      });
      throw error;
    } finally {
      this.setIsMutating(false);
    }
  }
}
