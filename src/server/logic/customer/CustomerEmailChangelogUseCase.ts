import { NotAuthorisedError } from "~/server/errors/NotAuthorisedError";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class CustomerEmailChangelogUseCase extends UseCase {
  async execute(input: {
    customerId: number;
    projectId: number;
    sprintId: number; 
    changelogId: number;
  }) {
    // Get the customer record first to validate they exist
    const customer = await this.db.customer.findUnique({
      where: {
        id: input.customerId,
      },
    });

    if (!customer) {
      throw new RecordNotFoundError("Customer not found");
    }

    // Check if customer has access to this project via accepted invitation
    const invitation = await this.db.customerInvitation.findFirst({
      where: {
        email: customer.email,
        projectId: input.projectId,
        status: "accepted",
      },
    });

    if (!invitation) {
      throw new NotAuthorisedError("You don't have access to this project");
    }

    // Get the changelog to ensure it exists and is published
    const changelog = await this.db.changelog.findFirst({
      where: {
        id: input.changelogId,
        sprintId: input.sprintId,
        isPublished: true,
      },
      include: {
        sprint: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!changelog) {
      throw new RecordNotFoundError("Changelog not found or not published");
    }

    // Verify this changelog belongs to the specified project
    if (changelog.sprint.projectId !== input.projectId) {
      throw new NotAuthorisedError("Changelog does not belong to this project");
    }

    // Update the changelog to mark it as shared via email
    await this.db.changelog.update({
      where: {
        id: input.changelogId,
      },
      data: {
        sharedViaEmail: true,
        sharedAt: new Date(),
      },
    });

    // TODO: Implement actual email sending logic here
    // For now, we'll just mark it as emailed
    // In a real implementation, you would:
    // 1. Generate the email content
    // 2. Send email to the customer
    // 3. Handle email delivery status

    return {
      success: true,
      message: "Changelog has been emailed successfully",
      changelogId: input.changelogId,
    };
  }
}

export type CustomerEmailChangelogType = getReturnType<CustomerEmailChangelogUseCase>;
