import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

interface EmailChangelogParams {
  sprintId: number;
  content: string;
  customerIds: number[];
  projectName: string;
  sprintName: string;
}

export class EmailChangelogUseCase extends UseCase {
  public mutation = api.changelog.shareEmail.useMutation();

  public async execute(params: EmailChangelogParams) {
    try {
      this.setIsMutating(true);
      await this.mutation.mutateAsync(params);

      ShowNotificationUtil({
        title: "Success",
        message: "Changelog has been emailed to customers successfully",
      });

      // Invalidate changelog queries
      await this.useUtils.changelog.getAll.invalidate();
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: "Error",
        message: errorMessage || "Failed to send email",
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
