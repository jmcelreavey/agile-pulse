import { NotAuthorisedError } from "~/server/errors/NotAuthorisedError";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { ExportChangelogPdfUseCase } from "~/server/logic/changelog/ExportChangelogPdfUseCase";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class CustomerExportChangelogPdfUseCase extends UseCase {
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

    // Create a temporary user object for the PDF export (using system user)
    const systemUser = {
      id: 1, // System user ID
      email: "system@agile-pulse.com",
      domain: "agile-pulse.com",
    };

    // Use the existing ExportChangelogPdfUseCase
    const exportPdf = new ExportChangelogPdfUseCase(this.db, systemUser);
    
    const result = await exportPdf.execute({
      sprintId: input.sprintId,
      content: changelog.content,
      projectName: changelog.sprint.project.name,
      sprintName: `Sprint ${changelog.sprint.reference}`,
    });

    return result;
  }
}

export type CustomerExportChangelogPdfType = getReturnType<CustomerExportChangelogPdfUseCase>;
