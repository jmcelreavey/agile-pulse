import { InternalServerError } from "~/server/errors/InternalServerError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { CustomerValidationService } from "~/server/logic/customer/CustomerValidationService";
import { InvitationValidationService } from "~/server/logic/customer/InvitationValidationService";

export class AcceptExistingCustomerInvitationUseCase extends UseCase {
  async execute(input: {
    token: string;
    email: string;
    password: string;
  }) {
    // Use validation services
    const invitationValidationService = new InvitationValidationService(this.db);
    const customerValidationService = new CustomerValidationService(this.db);

    // Validate invitation
    const invitation = await invitationValidationService.validateInvitationToken(input.token);

    // Verify email matches invitation
    if (invitation.email !== input.email) {
      throw new InternalServerError("Email does not match invitation");
    }

    // Validate customer credentials
    const customer = await customerValidationService.validateCustomerCredentials({
      email: input.email,
      password: input.password,
    });

    try {
      // Mark invitation as accepted and link to customer
      await invitationValidationService.markInvitationAsAccepted(invitation.id, customer.id);

      return {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        companyName: customer.companyName,
        project: invitation.project,
      };
    } catch (error) {
      console.error("Error accepting invitation for existing customer:", error);
      throw new InternalServerError("Failed to accept invitation");
    }
  }
}

export type AcceptExistingCustomerInvitationType = getReturnType<AcceptExistingCustomerInvitationUseCase>;
export type AcceptExistingCustomerInvitationInput = Parameters<
  AcceptExistingCustomerInvitationUseCase["execute"]
>[0];