import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class GetCustomerPendingInvitationsUseCase extends UseCase {
  async execute(input: { customerId: number }) {
    // Get the customer record first to validate they exist
    const customer = await this.db.customer.findUnique({
      where: {
        id: input.customerId,
      },
    });

    if (!customer) {
      return []; // Return empty array if customer not found
    }

    const pendingInvitations = await this.db.customerInvitation.findMany({
      where: {
        OR: [
          // Invitations sent to customer's email
          { email: customer.email, status: "pending" },
          // Invitations already linked to customer but still pending
          { customerId: input.customerId, status: "pending" },
        ],
        expiresAt: {
          gt: new Date(), // Only non-expired invitations
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            state: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return pendingInvitations.map((invitation) => ({
      id: invitation.id,
      token: invitation.token,
      email: invitation.email,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      project: invitation.project,
      invitedBy: invitation.invitedBy,
    }));
  }
}

export type GetCustomerPendingInvitationsType = getReturnType<GetCustomerPendingInvitationsUseCase>;
export type GetCustomerPendingInvitationsInput = Parameters<
  GetCustomerPendingInvitationsUseCase["execute"]
>[0];
