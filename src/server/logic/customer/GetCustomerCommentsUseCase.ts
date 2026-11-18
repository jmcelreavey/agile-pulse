import {
  type GetCustomerCommentsInputType,
  GetCustomerCommentsSchema,
} from "~/server/api/schemas/customer";
import { NotAuthorisedError } from "~/server/errors/NotAuthorisedError";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class GetCustomerCommentsUseCase extends UseCase {
  async execute(input: GetCustomerCommentsInputType, customerId: number) {
    // Validate input
    const validatedInput = GetCustomerCommentsSchema.parse(input);

    // Check if customer exists
    const customer = await this.db.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new RecordNotFoundError("Customer not found");
    }

    // Check if project exists
    const project = await this.db.project.findUnique({
      where: { id: validatedInput.projectId },
    });

    if (!project) {
      throw new RecordNotFoundError("Project not found");
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

    // If sprintId is provided, validate it exists and belongs to the project
    if (validatedInput.sprintId) {
      const sprint = await this.db.sprint.findFirst({
        where: {
          id: validatedInput.sprintId,
          projectId: validatedInput.projectId,
        },
      });

      if (!sprint) {
        throw new RecordNotFoundError("Sprint not found or does not belong to this project");
      }
    }

    // Get comments by this customer for this project (and optionally sprint)
    const comments = await this.db.customerComment.findMany({
      where: {
        customerId,
        projectId: validatedInput.projectId,
        // If sprintId is specified, filter to that sprint only, otherwise get all
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return comments;
  }
}

export type GetCustomerCommentsType = getReturnType<GetCustomerCommentsUseCase>;
