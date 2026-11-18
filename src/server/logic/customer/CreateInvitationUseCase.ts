import crypto from "crypto";
import { InternalServerError } from "~/server/errors/InternalServerError";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import {
  AuthenticatedUseCase,
  type getReturnType,
} from "~/server/logic/useCase";
import { CustomerValidationService } from "~/server/logic/customer/CustomerValidationService";

export class CreateInvitationUseCase extends AuthenticatedUseCase {
  async execute(input: { email: string; projectId: number }) {
    // Verify project exists and user has access
    const project = await this.db.project.findFirst({
      where: {
        id: input.projectId,
        domain: this.user.domain,
      },
    });

    if (!project) {
      throw new RecordNotFoundError("Project not found or access denied");
    }

    // Use validation service to check customer and access
    const customerValidationService = new CustomerValidationService(this.db);

    const existingInvitation = await customerValidationService.checkCustomerProjectAccess({
      email: input.email,
      projectId: input.projectId,
    });

    if (existingInvitation) {
      throw new InternalServerError(
        "Customer already has access to this project"
      );
    }

    // Check for pending invitations
    const pendingInvitation = await this.db.customerInvitation.findFirst({
      where: {
        email: input.email,
        projectId: input.projectId,
        status: "pending",
      },
    });

    if (pendingInvitation) {
      throw new InternalServerError(
        "An invitation for this email already exists for this project"
      );
    }

    // Check if customer already exists
    const existingCustomer = await customerValidationService.checkCustomerExists(input.email);

    // Generate secure token and expiration date (7 days from now)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    try {
      const invitation = await this.db.customerInvitation.create({
        data: {
          email: input.email,
          token,
          projectId: input.projectId,
          invitedById: this.user.id,
          expiresAt,
          // Link to existing customer if they exist
          customerId: existingCustomer?.id,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          invitedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          customer: existingCustomer ? {
            select: {
              id: true,
              name: true,
              email: true,
            },
          } : false,
        },
      });

      return {
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
        projectId: invitation.projectId,
        project: invitation.project,
        invitedBy: invitation.invitedBy,
        customer: invitation.customer,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        isExistingCustomer: !!existingCustomer,
      };
    } catch (error) {
      console.error("Error creating invitation:", error);
      throw new InternalServerError("Failed to create invitation");
    }
  }
}

export type CreateInvitationType = getReturnType<CreateInvitationUseCase>;
export type CreateInvitationInput = Parameters<
  CreateInvitationUseCase["execute"]
>[0];
