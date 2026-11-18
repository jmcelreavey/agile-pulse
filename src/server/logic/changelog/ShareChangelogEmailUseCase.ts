import { env } from "~/env";
import { createEmailService } from "~/server/email/EmailService";
import {
  EmailTemplateService,
  type ChangelogEmailData,
} from "~/server/email/EmailTemplateService";
import { AuthenticatedUseCase } from "~/server/logic/useCase";

interface ShareChangelogEmailInput {
  sprintId: number;
  content: string;
  customerIds: number[];
  projectName: string;
  sprintName: string;
}

export class ShareChangelogEmailUseCase extends AuthenticatedUseCase {
  private emailService = createEmailService(env.RESEND_API_KEY, env.EMAIL_FROM);

  async execute(input: ShareChangelogEmailInput) {
    const { sprintId, content, customerIds, projectName, sprintName } = input;

    // Get customer details - if no customerIds provided, get all customers for the project
    let customers;

    if (customerIds.length === 0) {
      // Get all customers who have accepted invitations for this project
      const sprint = await this.db.sprint.findUnique({
        where: { id: sprintId },
        select: { projectId: true },
      });

      if (!sprint) {
        throw new Error("Sprint not found");
      }

      customers = await this.db.customer.findMany({
        where: {
          customerInvitations: {
            some: {
              projectId: sprint.projectId,
              status: "accepted",
            },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    } else {
      customers = await this.db.customer.findMany({
        where: {
          id: { in: customerIds },
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    }

    if (customers.length === 0) {
      throw new Error("No valid customers found for sharing");
    }

    // For now, we'll log the email sharing action
    // In a real implementation, this would integrate with an email service
    console.log("Sharing changelog via email:", {
      sprintId,
      projectName,
      sprintName,
      recipients: customers.map((c) => ({ name: c.name, email: c.email })),
      contentLength: content.length,
      userId: this.user.id,
    });

    // Generate and send email content for each customer
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const emailResults = await Promise.all(
      customers.map(async (customer) => {
        const emailData: ChangelogEmailData = {
          projectName,
          sprintName,
          changelogContent: content,
          customerName: customer.name,
          generateDate: currentDate,
          sharedDate: currentDate,
        };

        const emailHtml =
          EmailTemplateService.generateChangelogEmailHtml(emailData);
        const emailText =
          EmailTemplateService.generateChangelogEmailText(emailData);
        const emailSubject = EmailTemplateService.generateChangelogEmailSubject(
          projectName,
          sprintName
        );

        try {
          const result = await this.emailService.send({
            to: customer.email,
            subject: emailSubject,
            html: emailHtml,
            text: emailText,
          });

          return {
            customerId: customer.id,
            customerEmail: customer.email,
            subject: emailSubject,
            sent: result.success,
            messageId: result.messageId,
            error: result.error,
          };
        } catch (error) {
          return {
            customerId: customer.id,
            customerEmail: customer.email,
            subject: emailSubject,
            sent: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update the changelog to mark it as shared via email
    const changelog = await this.db.changelog.findFirst({
      where: { sprintId },
    });

    if (changelog) {
      // Update changelog sharing status
      await this.db.changelog.update({
        where: { id: changelog.id },
        data: {
          sharedAt: new Date(),
          sharedViaEmail: true,
        },
      });

      // Create sharing history records for each successful email
      const successfulEmails = emailResults.filter((result) => result.sent);
      const sharingHistoryData = successfulEmails.map((result) => ({
        changelogId: changelog.id,
        method: "email",
        recipientEmail: result.customerEmail,
        recipientName:
          customers.find((c) => c.email === result.customerEmail)?.name ||
          "Unknown",
        customerId: customers.find((c) => c.email === result.customerEmail)?.id,
        sharedBy: this.user.id,
        status: "sent" as const,
      }));

      if (sharingHistoryData.length > 0) {
        await this.db.changelogSharing.createMany({
          data: sharingHistoryData,
        });
      }

      // Create failed sharing records
      const failedEmails = emailResults.filter((result) => !result.sent);
      const failedSharingData = failedEmails.map((result) => ({
        changelogId: changelog.id,
        method: "email",
        recipientEmail: result.customerEmail,
        recipientName:
          customers.find((c) => c.email === result.customerEmail)?.name ||
          "Unknown",
        customerId: customers.find((c) => c.email === result.customerEmail)?.id,
        sharedBy: this.user.id,
        status: "failed" as const,
        errorMessage: result.error || "Unknown error",
      }));

      if (failedSharingData.length > 0) {
        await this.db.changelogSharing.createMany({
          data: failedSharingData,
        });
      }
    }

    return {
      success: true,
      sharedWith: customers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
      })),
      emailResults,
      message: `Changelog shared with ${customers.length} customer(s) via email`,
    };
  }
}
