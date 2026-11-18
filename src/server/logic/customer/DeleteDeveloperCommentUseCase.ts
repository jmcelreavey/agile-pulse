import {
    type DeleteDeveloperCommentInputType,
    DeleteDeveloperCommentSchema,
} from "~/server/api/schemas/customer";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { AuthenticatedUseCase, type getReturnType } from "~/server/logic/useCase";

export class DeleteDeveloperCommentUseCase extends AuthenticatedUseCase {
  async execute(input: DeleteDeveloperCommentInputType) {
    // Validate input
    const validatedInput = DeleteDeveloperCommentSchema.parse(input);

    // Check if project exists (developers have general access)
    const project = await this.db.project.findFirst({
      where: {
        id: validatedInput.projectId,
      },
    });

    if (!project) {
      throw new RecordNotFoundError("Project not found");
    }

    // Find the comment and verify ownership
    const comment = await this.db.developerComment.findFirst({
      where: {
        id: validatedInput.commentId,
        userId: this.user.id,
        projectId: validatedInput.projectId,
        // If sprintId is provided, ensure the comment belongs to that sprint
        ...(validatedInput.sprintId !== undefined && {
          sprintId: validatedInput.sprintId,
        }),
      },
    });

    if (!comment) {
      throw new RecordNotFoundError(
        "Comment not found or you don't have permission to delete it"
      );
    }

    // Delete the comment
    await this.db.developerComment.delete({
      where: { id: validatedInput.commentId },
    });

    return { success: true, deletedCommentId: validatedInput.commentId };
  }
}

export type DeleteDeveloperCommentType =
  getReturnType<DeleteDeveloperCommentUseCase>;
