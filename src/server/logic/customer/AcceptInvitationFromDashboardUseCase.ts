import { InternalServerError } from "~/server/errors/InternalServerError";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { InvitationValidationService } from "~/server/logic/customer/InvitationValidationService";

export class AcceptInvitationFromDashboardUseCase extends UseCase {
  async execute(input: { invitationId: number; customerId: number }) {
    const invitationValidationService = new InvitationValidationService(this.db);

    // Get the customer record first to validate they exist
    const customer = await this.db.customer.findUnique({
      where: {
        id: input.customerId,
      },
    });

    if (!customer) {
      throw new RecordNotFoundError("Customer not found");
    }

    // Find the invitation
    const invitation = await this.db.customerInvitation.findUnique({
      where: { id: input.invitationId },
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
      throw new RecordNotFoundError("Invitation not found");
    }

    // Verify the invitation belongs to this customer (either by email or already linked)
    if (
      invitation.email !== customer.email &&
      invitation.customerId !== customer.id
    ) {
      throw new RecordNotFoundError("Invitation not found");
    }

    // Check if invitation is still valid
    if (invitation.status !== "pending") {
      throw new InternalServerError("Invitation has already been processed");
    }

    if (invitation.expiresAt < new Date()) {
      throw new InternalServerError("Invitation has expired");
    }

    // Check if customer already has access to this project via another accepted invitation
    const existingAccess = await this.db.customerInvitation.findFirst({
      where: {
        email: customer.email,
        projectId: invitation.projectId,
        status: "accepted",
      },
    });

    if (existingAccess) {
      // Mark this invitation as accepted too for consistency
      await invitationValidationService.markInvitationAsAccepted(
        invitation.id,
        customer.id
      );

      return {
        success: true,
        message: "You already have access to this project",
        project: invitation.project,
      };
    }

    try {
      // Accept the invitation - this grants access to the project
      await invitationValidationService.markInvitationAsAccepted(
        invitation.id,
        customer.id
      );

      return {
        success: true,
        message: "Invitation accepted successfully",
        project: invitation.project,
      };
    } catch (error) {
      console.error("Error accepting invitation from dashboard:", error);
      throw new InternalServerError("Failed to accept invitation");
    }
  }
}

export type AcceptInvitationFromDashboardType = getReturnType<AcceptInvitationFromDashboardUseCase>;
export type AcceptInvitationFromDashboardInput = Parameters<
  AcceptInvitationFromDashboardUseCase["execute"]
>[0];