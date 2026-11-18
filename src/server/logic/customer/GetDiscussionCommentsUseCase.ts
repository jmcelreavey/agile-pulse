import {
    type GetDiscussionCommentsInputType,
    GetDiscussionCommentsSchema,
} from "~/server/api/schemas/customer";
import { NotAuthorisedError } from "~/server/errors/NotAuthorisedError";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { AuthenticatedUseCase, type getReturnType } from "~/server/logic/useCase";

// Extended input type for internal use
type ExtendedDiscussionCommentsInput = GetDiscussionCommentsInputType & {
  customerId?: number;
};

export class GetDiscussionCommentsUseCase extends AuthenticatedUseCase {
  async execute(input: ExtendedDiscussionCommentsInput) {
    // Validate basic input
    const validatedInput = GetDiscussionCommentsSchema.parse(input);

    // Check access based on whether customerId is provided (customer vs developer)
    if (input.customerId) {
      // Customer access: check via invitation
      const customer = await this.db.customer.findUnique({
        where: { id: input.customerId },
      });

      if (!customer) {
        throw new RecordNotFoundError("Customer not found");
      }

      // Check if customer has access to this project via accepted invitation
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
    } else {
      // Developer access: check if project exists (developers have general access)
      const project = await this.db.project.findFirst({
        where: {
          id: validatedInput.projectId,
        },
      });

      if (!project) {
        throw new RecordNotFoundError("Project not found");
      }
    }

    // If sprintId is provided, validate it exists and belongs to the project
    if (validatedInput.sprintId) {
      const sprint = await this.db.sprint.findFirst({
        where: {
          id: validatedInput.sprintId,
          projectId: validatedInput.projectId,
        },
      });

      if (!sprint) {
        throw new RecordNotFoundError("Sprint not found or access denied");
      }
    }

    // Get customer comments
    const customerComments = await this.db.customerComment.findMany({
      where: {
        projectId: validatedInput.projectId,
        ...(validatedInput.sprintId !== undefined && {
          sprintId: validatedInput.sprintId,
        }),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        sprint: {
          select: {
            id: true,
            reference: true,
          },
        },
      },
    });

    // Get developer comments for this project
    const developerComments = await this.db.developerComment.findMany({
      where: {
        projectId: validatedInput.projectId,
        ...(validatedInput.sprintId !== undefined && {
          sprintId: validatedInput.sprintId,
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        sprint: {
          select: {
            id: true,
            reference: true,
          },
        },
      },
    });

    // Combine and sort all comments by creation date
    const allComments = [
      ...customerComments.map((comment) => ({
        ...comment,
        type: "customer" as const,
        author: {
          id: comment.customer.id,
          name: comment.customer.name,
          email: comment.customer.email,
          companyName: comment.customer.companyName,
        },
      })),
      ...developerComments.map((comment) => ({
        ...comment,
        type: "developer" as const,
        author: {
          id: comment.user.id,
          name: comment.user.name,
          email: comment.user.email,
        },
      })),
    ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return allComments;
  }
}

export type GetDiscussionCommentsType = getReturnType<GetDiscussionCommentsUseCase>;
