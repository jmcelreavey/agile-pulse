import { AuthenticatedUseCase } from "~/server/logic/useCase";

interface GetProjectCustomersInput {
  projectId: number;
}

export class GetProjectCustomersUseCase extends AuthenticatedUseCase {
  async execute(input: GetProjectCustomersInput) {
    const { projectId } = input;

    // Get all accepted invitations for this project
    const acceptedInvitations = await this.db.customerInvitation.findMany({
      where: {
        projectId,
        status: "accepted",
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            name: true,
            companyName: true,
          },
        },
      },
    });

    // Extract unique customers (in case of multiple invitations)
    const customersMap = new Map<
      number,
      {
        id: string;
        email: string;
        name: string;
        companyName: string | null;
      }
    >();

    acceptedInvitations.forEach((invitation) => {
      if (invitation.customer) {
        customersMap.set(invitation.customer.id, {
          id: invitation.customer.id.toString(),
          email: invitation.customer.email,
          name: invitation.customer.name,
          companyName: invitation.customer.companyName,
        });
      }
    });

    const customers = Array.from(customersMap.values());

    return customers;
  }
}
