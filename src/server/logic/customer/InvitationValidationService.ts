import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase } from "~/server/logic/useCase";

export class InvitationValidationService extends UseCase {
  async validateInvitationToken(token: string) {
    const invitation = await this.db.customerInvitation.findUnique({
      where: {
        token,
        status: "pending",
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new RecordNotFoundError("Invitation not found or already used");
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      await this.db.customerInvitation.update({
        where: { id: invitation.id },
        data: { status: "expired" },
      });
      throw new RecordNotFoundError("Invitation has expired");
    }

    return invitation;
  }

  async checkPendingInvitation(input: { email: string; projectId: number }) {
    return await this.db.customerInvitation.findFirst({
      where: {
        email: input.email,
        projectId: input.projectId,
        status: "pending",
      },
    });
  }

  async markInvitationAsAccepted(invitationId: number, customerId?: number) {
    return await this.db.customerInvitation.update({
      where: { id: invitationId },
      data: {
        status: "accepted",
        ...(customerId && { customerId }),
      },
    });
  }

  async markInvitationAsExpired(invitationId: number) {
    return await this.db.customerInvitation.update({
      where: { id: invitationId },
      data: { status: "expired" },
    });
  }
}

export type InvitationValidationInput = Parameters<
  InvitationValidationService["validateInvitationToken"]
>[0];
