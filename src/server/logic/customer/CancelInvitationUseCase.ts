import { InternalServerError } from "~/server/errors/InternalServerError";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import {
  AuthenticatedUseCase,
  type getReturnType,
} from "~/server/logic/useCase";

export class CancelInvitationUseCase extends AuthenticatedUseCase {
  async execute(input: { invitationId: number }) {
    // Find the invitation and verify user has access
    const invitation = await this.db.customerInvitation.findFirst({
      where: {
        id: input.invitationId,
        project: {
          domain: this.user.domain,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new RecordNotFoundError("Invitation not found or access denied");
    }

    // Only allow canceling pending invitations
    if (invitation.status !== "pending") {
      throw new InternalServerError(
        `Cannot cancel invitation with status: ${invitation.status}`
      );
    }

    try {
      // Update invitation status to cancelled
      const cancelledInvitation = await this.db.customerInvitation.update({
        where: { id: invitation.id },
        data: { status: "cancelled" },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        id: cancelledInvitation.id,
        email: cancelledInvitation.email,
        status: cancelledInvitation.status,
        project: cancelledInvitation.project,
      };
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      throw new InternalServerError("Failed to cancel invitation");
    }
  }
}

export type CancelInvitationType = getReturnType<CancelInvitationUseCase>;
export type CancelInvitationInput = Parameters<
  CancelInvitationUseCase["execute"]
>[0];
