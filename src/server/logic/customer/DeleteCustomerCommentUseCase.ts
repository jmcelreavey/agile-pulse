import {
    type DeleteCustomerCommentInputType,
    DeleteCustomerCommentSchema,
} from "~/server/api/schemas/customer";
import { NotAuthorisedError } from "~/server/errors/NotAuthorisedError";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class DeleteCustomerCommentUseCase extends UseCase {
  async execute(input: DeleteCustomerCommentInputType, customerId?: number) {
    // Validate input
    const validatedInput = DeleteCustomerCommentSchema.parse(input);

    // Check if project exists
    const project = await this.db.project.findUnique({
      where: { id: validatedInput.projectId },
    });

    if (!project) {
      throw new RecordNotFoundError("Project not found");
    }

    if (customerId) {
      // Customer access: check customer exists and has access
      const customer = await this.db.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new RecordNotFoundError("Customer not found");
      }

      // Check if customer has accepted invitation for this project
      const invitation = await this.db.customerInvitation.findFirst({
        where: {
          email: customer.email,
          projectId: validatedInput.projectId,
          status: "accepted",
        },
      });

      if (!invitation) {
        throw new NotAuthorisedError("You don't have access to this project");
      }

      // Find the comment and verify ownership for customers
      const comment = await this.db.customerComment.findFirst({
        where: {
          id: validatedInput.commentId,
          customerId,
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
    } else {
      // Developer access: just check if comment exists for this project
      const comment = await this.db.customerComment.findFirst({
        where: {
          id: validatedInput.commentId,
          projectId: validatedInput.projectId,
          // If sprintId is provided, ensure the comment belongs to that sprint
          ...(validatedInput.sprintId !== undefined && {
            sprintId: validatedInput.sprintId,
          }),
        },
      });

      if (!comment) {
        throw new RecordNotFoundError("Comment not found");
      }
    }

    // Delete the comment
    await this.db.customerComment.delete({
      where: { id: validatedInput.commentId },
    });

    return { success: true, deletedCommentId: validatedInput.commentId };
  }
}

export type DeleteCustomerCommentType =
  getReturnType<DeleteCustomerCommentUseCase>;
