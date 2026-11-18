import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class GetCustomerProjectsUseCase extends UseCase {
  async execute(input: { customerId: number }) {
    // Get the customer record first to validate they exist
    const customer = await this.db.customer.findUnique({
      where: {
        id: input.customerId,
      },
    });

    if (!customer) {
      throw new RecordNotFoundError("Customer not found");
    }

    // Find all accepted invitations for this customer
    const acceptedInvitations = await this.db.customerInvitation.findMany({
      where: {
        email: customer.email,
        status: "accepted",
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            state: true,
            colour: true,
            createdAt: true,
            updatedAt: true,
            startedAt: true,
            completedAt: true,
            // Include sprint information for the project
            sprints: {
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
              select: {
                id: true,
                reference: true,
              },
            },
            _count: {
              select: {
                sprints: true,
              },
            },
          },
        },
      },
      orderBy: {
        project: {
          updatedAt: "desc",
        },
      },
    });

    // Extract and return just the project data
    const projects = acceptedInvitations.map((invitation) => {
      const { sprints, _count, ...projectData } = invitation.project;
      return {
        ...projectData,
        invitationId: invitation.id,
        invitedAt: invitation.createdAt,
        lastUpdatedSprint: sprints.length > 0 ? sprints[0] : null,
        sprintsCount: _count.sprints,
      };
    });

    return projects;
  }
}

export type GetCustomerProjectsType = getReturnType<GetCustomerProjectsUseCase>;
export type GetCustomerProjectsInput = Parameters<
  GetCustomerProjectsUseCase["execute"]
>[0];
