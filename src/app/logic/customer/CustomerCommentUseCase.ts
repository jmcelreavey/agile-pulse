import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class CustomerCommentUseCase extends UseCase {
  private createComment = api.customer.createComment.useMutation();
  private deleteComment = api.customer.deleteComment.useMutation();

  public async createCommentAction(input: {
    projectId: number;
    sprintId?: number;
    content: string;
  }) {
    try {
      this.setIsMutating(true);

      await this.createComment.mutateAsync(input);

      // Invalidate comments to refresh UI
      await this.useUtils.customer.getComments.invalidate({
        projectId: input.projectId,
        sprintId: input.sprintId,
      });

      // Also invalidate team comments if this could be visible to them
      await this.useUtils.customer.getProjectComments.invalidate({
        projectId: input.projectId,
        sprintId: input.sprintId,
      });

      // Don't show notification here - let the form handle it
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: "Failed to post comment",
        message: errorMessage,
        isError: true,
      });
      throw error;
    } finally {
      this.setIsMutating(false);
    }
  }

  public async deleteCommentAction(input: {
    commentId: number;
    projectId: number;
    sprintId?: number;
  }) {
    try {
      this.setIsMutating(true);

      await this.deleteComment.mutateAsync(input);

      // Invalidate comments to refresh UI
      await this.useUtils.customer.getComments.invalidate({
        projectId: input.projectId,
        sprintId: input.sprintId,
      });

      // Also invalidate team comments if this could be visible to them
      await this.useUtils.customer.getProjectComments.invalidate({
        projectId: input.projectId,
        sprintId: input.sprintId,
      });

      ShowNotificationUtil({
        title: "Comment deleted",
        message: "Your comment has been removed",
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: "Failed to delete comment",
        message: errorMessage,
        isError: true,
      });
      throw error;
    } finally {
      this.setIsMutating(false);
    }
  }
}
