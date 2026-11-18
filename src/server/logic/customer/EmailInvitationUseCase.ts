import { env } from "~/env";
import { createEmailService } from "~/server/email/EmailService";
import {
  EmailTemplateService,
  type InvitationEmailData,
} from "~/server/email/EmailTemplateService";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class EmailInvitationUseCase extends UseCase {
  private emailService = createEmailService(env.RESEND_API_KEY, env.EMAIL_FROM);

  async execute(input: {
    email: string;
    token: string;
    projectName: string;
    invitedByName: string;
    isExistingCustomer?: boolean;
  }) {
    const isExistingCustomer = input.isExistingCustomer || false;

    // Generate invitation URL
    const baseUrl = env.AUTH_URL ?? env.SITE_URL;
    const invitationUrl = isExistingCustomer
      ? `${baseUrl}/customer/accept/${input.token}`
      : `${baseUrl}/customer/register/${input.token}`;

    // Generate email content using the standardized template service
    const emailData: InvitationEmailData = {
      customerEmail: input.email,
      projectName: input.projectName,
      invitedByName: input.invitedByName,
      invitationUrl,
      isExistingCustomer,
      expirationDays: 7,
    };

    const emailHtml =
      EmailTemplateService.generateInvitationEmailHtml(emailData);
    const emailText =
      EmailTemplateService.generateInvitationEmailText(emailData);
    const emailSubject = EmailTemplateService.generateInvitationEmailSubject(
      input.projectName,
      input.invitedByName
    );

    // Send email using the email service
    try {
      const result = await this.emailService.send({
        to: input.email,
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
      });

      return {
        success: result.success,
        emailSent: result.success,
        invitationUrl,
        isExistingCustomer,
        messageId: result.messageId,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        emailSent: false,
        invitationUrl,
        isExistingCustomer,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export type EmailInvitationType = getReturnType<EmailInvitationUseCase>;
export type EmailInvitationInput = Parameters<
  EmailInvitationUseCase["execute"]
>[0];
