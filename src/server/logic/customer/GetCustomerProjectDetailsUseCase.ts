import { NotAuthorisedError } from "~/server/errors/NotAuthorisedError";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class GetCustomerProjectDetailsUseCase extends UseCase {
  async execute(input: { customerId: number; projectId: number }) {
    // Get the customer record first to validate they exist
    const customer = await this.db.customer.findUnique({
      where: {
        id: input.customerId,
      },
    });

    if (!customer) {
      throw new RecordNotFoundError("Customer not found");
    }

    // Check if customer has access to this project via accepted invitation
    const invitation = await this.db.customerInvitation.findFirst({
      where: {
        email: customer.email,
        projectId: input.projectId,
        status: "accepted",
      },
    });

    if (!invitation) {
      throw new NotAuthorisedError("You don't have access to this project");
    }

    // Fetch project details with limited information for customer
    const project = await this.db.project.findUnique({
      where: {
        id: input.projectId,
      },
      include: {
        // Include basic sprint information but no detailed task data
        sprints: {
          select: {
            id: true,
            reference: true,
            state: true,

            startedAt: true,
            completedAt: true,
            _count: {
              select: {
                sprintTasks: true,
              },
            },
          },
          orderBy: {
            reference: "desc",
          },
        },
        // Include customer comments for this project
        CustomerComment: {
          where: {
            customerId: input.customerId,
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            customer: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new RecordNotFoundError("Project not found");
    }

    return {
      ...project,
      invitedAt: invitation.createdAt,
    };
  }
}

export type GetCustomerProjectDetailsType =
  getReturnType<GetCustomerProjectDetailsUseCase>;
