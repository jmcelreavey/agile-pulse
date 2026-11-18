import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class DeveloperCommentUseCase extends UseCase {
  private createComment = api.customer.createDeveloperComment.useMutation();
  private deleteComment = api.customer.deleteDeveloperComment.useMutation();

  public async createCommentAction(input: {
    projectId: number;
    sprintId?: number;
    content: string;
  }) {
    try {
      this.setIsMutating(true);

      await this.createComment.mutateAsync(input);

      // Invalidate comments to refresh UI
      await this.useUtils.customer.getDeveloperComments.invalidate({
        projectId: input.projectId,
        sprintId: input.sprintId,
      });

      // Also invalidate discussion comments
      await this.useUtils.customer.getDiscussionComments.invalidate({
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
      await this.useUtils.customer.getDeveloperComments.invalidate({
        projectId: input.projectId,
        sprintId: input.sprintId,
      });

      // Also invalidate discussion comments
      await this.useUtils.customer.getDiscussionComments.invalidate({
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
