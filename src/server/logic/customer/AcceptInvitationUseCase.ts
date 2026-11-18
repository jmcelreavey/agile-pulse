import bcrypt from "bcryptjs";
import { InternalServerError } from "~/server/errors/InternalServerError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { InvitationValidationService } from "~/server/logic/customer/InvitationValidationService";

export class AcceptInvitationUseCase extends UseCase {
  async execute(input: {
    token: string;
    name: string;
    companyName?: string;
    password: string;
  }) {
    // Use validation service
    const invitationValidationService = new InvitationValidationService(this.db);

    // Validate invitation
    const invitation = await invitationValidationService.validateInvitationToken(input.token);

    // Check if customer already exists
    const existingCustomer = await this.db.customer.findUnique({
      where: { email: invitation.email },
    });

    if (existingCustomer) {
      // If customer exists, link them to the project
      await invitationValidationService.markInvitationAsAccepted(invitation.id, existingCustomer.id);

      return {
        id: existingCustomer.id,
        email: existingCustomer.email,
        name: existingCustomer.name,
        companyName: existingCustomer.companyName,
        message: "Invitation accepted for existing customer account",
      };
    }

    // Hash the password for new customer
    const hashedPassword = await bcrypt.hash(input.password, 12);

    try {
      // D1 has no interactive transactions, so create the customer, then mark the invitation.
      const result = await (async () => {
        const customer = await this.db.customer.create({
          data: {
            email: invitation.email,
            name: input.name,
            companyName: input.companyName,
            hashedPassword,
          },
        });

        await this.db.customerInvitation.update({
          where: { id: invitation.id },
          data: {
            status: "accepted",
            customerId: customer.id,
          },
        });

        return customer;
      })();

      return {
        id: result.id,
        email: result.email,
        name: result.name,
        companyName: result.companyName,
      };
    } catch (error) {
      console.error("Error creating customer account:", error);
      throw new InternalServerError("Failed to create customer account");
    }
  }
}

export type AcceptInvitationType = getReturnType<AcceptInvitationUseCase>;
export type AcceptInvitationInput = Parameters<
  AcceptInvitationUseCase["execute"]
>[0];
