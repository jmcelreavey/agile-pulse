import bcrypt from "bcryptjs";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase } from "~/server/logic/useCase";

export class CustomerValidationService extends UseCase {
  async validateCustomerCredentials(input: {
    email: string;
    password: string;
  }) {
    const customer = await this.db.customer.findUnique({
      where: { email: input.email },
    });

    if (!customer) {
      throw new RecordNotFoundError(
        "Customer account not found for this email"
      );
    }

    const isPasswordValid = await bcrypt.compare(
      input.password,
      customer.hashedPassword
    );
    if (!isPasswordValid) {
      throw new RecordNotFoundError("Invalid password");
    }

    return customer;
  }

  async checkCustomerExists(email: string) {
    return await this.db.customer.findUnique({
      where: { email },
    });
  }

  async checkCustomerProjectAccess(input: {
    email: string;
    projectId: number;
  }) {
    return await this.db.customerInvitation.findFirst({
      where: {
        email: input.email,
        projectId: input.projectId,
        status: "accepted",
      },
    });
  }
}

export type CustomerValidationInput = Parameters<
  CustomerValidationService["validateCustomerCredentials"]
>[0];
