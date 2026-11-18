export interface ChangelogEmailData {
  projectName: string;
  sprintName: string;
  changelogContent: string;
  customerName: string;
  generateDate: string;
  sharedDate: string;
}

export interface InvitationEmailData {
  customerEmail: string;
  projectName: string;
  invitedByName: string;
  invitationUrl: string;
  isExistingCustomer: boolean;
  expirationDays: number;
}

export class EmailTemplateService {
  /**
   * Generates HTML email template for changelog sharing
   */
  static generateChangelogEmailHtml(data: ChangelogEmailData): string {
    const {
      projectName,
      sprintName,
      changelogContent,
      customerName,
      generateDate,
      sharedDate,
    } = data;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sprint Changelog - ${projectName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 10px;
        }
        .project-info {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 25px;
            border-left: 4px solid #2c5aa0;
        }
        .project-name {
            font-size: 20px;
            font-weight: 600;
            color: #2c5aa0;
            margin: 0 0 5px 0;
        }
        .sprint-name {
            font-size: 16px;
            color: #6c757d;
            margin: 0;
        }
        .changelog-content {
            background-color: white;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 25px;
            margin: 25px 0;
            font-size: 15px;
            line-height: 1.7;
        }
        .changelog-content h1,
        .changelog-content h2,
        .changelog-content h3 {
            color: #2c5aa0;
            margin-top: 0;
        }
        .changelog-content h1 {
            font-size: 22px;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 10px;
        }
        .changelog-content h2 {
            font-size: 18px;
            margin-top: 25px;
        }
        .changelog-content h3 {
            font-size: 16px;
            margin-top: 20px;
        }
        .changelog-content ul,
        .changelog-content ol {
            padding-left: 20px;
        }
        .changelog-content li {
            margin-bottom: 5px;
        }
        .changelog-content p {
            margin-bottom: 15px;
        }
        .metadata {
            font-size: 12px;
            color: #6c757d;
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin-top: 25px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            font-size: 12px;
            color: #6c757d;
        }
        .button {
            display: inline-block;
            background-color: #2c5aa0;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 15px 0;
        }
        .greeting {
            margin-bottom: 20px;
            font-size: 16px;
        }
        @media only screen and (max-width: 600px) {
            body {
                padding: 10px;
            }
            .email-container {
                padding: 20px;
            }
            .changelog-content {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🚀 Agile Pulse</div>
            <p style="margin: 0; color: #6c757d;">Sprint Changelog Update</p>
        </div>

        <div class="greeting">
            Hello ${customerName},
        </div>

        <p>We're excited to share the latest updates from our development team. Here's what we've accomplished in the recent sprint:</p>

        <div class="project-info">
            <div class="project-name">${projectName}</div>
            <div class="sprint-name">${sprintName}</div>
        </div>

        <div class="changelog-content">
            ${changelogContent}
        </div>

        <div class="metadata">
            <strong>📊 Sprint Details:</strong><br>
            • Generated: ${generateDate}<br>
            • Shared: ${sharedDate}<br>
            • Project: ${projectName}<br>
            • Sprint: ${sprintName}
        </div>

        <p>Thank you for being part of our journey. We value your feedback and look forward to your continued partnership.</p>

        <div class="footer">
            <p>This changelog was automatically generated by Agile Pulse.</p>
            <p>If you have any questions or feedback, please don't hesitate to reach out.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generates plain text email template for changelog sharing
   */
  static generateChangelogEmailText(data: ChangelogEmailData): string {
    const {
      projectName,
      sprintName,
      changelogContent,
      customerName,
      generateDate,
      sharedDate,
    } = data;

    // Convert HTML to plain text (basic conversion)
    const plainTextContent = changelogContent
      .replace(/<[^>]+>/g, "") // Remove HTML tags
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();

    return `
🚀 AGILE PULSE - SPRINT CHANGELOG UPDATE

Hello ${customerName},

We're excited to share the latest updates from our development team. Here's what we've accomplished in the recent sprint:

PROJECT: ${projectName}
SPRINT: ${sprintName}

CHANGELOG:
${plainTextContent}

📊 SPRINT DETAILS:
• Generated: ${generateDate}
• Shared: ${sharedDate}
• Project: ${projectName}
• Sprint: ${sprintName}

Thank you for being part of our journey. We value your feedback and look forward to your continued partnership.

---
This changelog was automatically generated by Agile Pulse.
If you have any questions or feedback, please don't hesitate to reach out.
    `.trim();
  }

  /**
   * Generates email subject line for changelog
   */
  static generateChangelogEmailSubject(
    projectName: string,
    sprintName: string
  ): string {
    return `📊 ${projectName} - ${sprintName} Changelog Update`;
  }

  /**
   * Generates HTML email template for customer invitation
   */
  static generateInvitationEmailHtml(data: InvitationEmailData): string {
    const {
      projectName,
      invitedByName,
      invitationUrl,
      isExistingCustomer,
      expirationDays,
    } = data;

    const actionText = isExistingCustomer
      ? "Accept Invitation"
      : "Create Account & Accept";

    const welcomeMessage = isExistingCustomer
      ? `You've been invited to access the project <strong>"${projectName}"</strong> on Agile Pulse.`
      : `You've been invited to join Agile Pulse and access the project <strong>"${projectName}"</strong>.`;

    const instructions = isExistingCustomer
      ? "Since you already have an account with us, simply click the button below to accept the invitation and gain access to the project:"
      : "To accept this invitation and create your account, click the button below:";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Invitation - ${projectName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 10px;
        }
        .invitation-content {
            margin: 25px 0;
            font-size: 16px;
            line-height: 1.7;
        }
        .project-highlight {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #2c5aa0;
            text-align: center;
        }
        .project-name {
            font-size: 20px;
            font-weight: 600;
            color: #2c5aa0;
            margin: 0;
        }
        .invited-by {
            font-size: 14px;
            color: #6c757d;
            margin-top: 5px;
        }
        .cta-button {
            display: block;
            background-color: #2c5aa0;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 30px auto;
            max-width: 250px;
            font-size: 16px;
        }
        .expiration-notice {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 6px;
            margin: 25px 0;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            font-size: 12px;
            color: #6c757d;
        }
        .alternative-link {
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 6px;
            font-size: 12px;
            color: #6c757d;
            word-break: break-all;
        }
        @media only screen and (max-width: 600px) {
            body {
                padding: 10px;
            }
            .email-container {
                padding: 20px;
            }
            .cta-button {
                padding: 12px 20px;
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🚀 Agile Pulse</div>
            <p style="margin: 0; color: #6c757d;">Project Collaboration Invitation</p>
        </div>

        <div class="invitation-content">
            <p>Hello!</p>
            
            <p>${welcomeMessage}</p>
            
            <div class="project-highlight">
                <div class="project-name">${projectName}</div>
                <div class="invited-by">Invited by ${invitedByName}</div>
            </div>

            <p>${instructions}</p>

            <a href="${invitationUrl}" class="cta-button">${actionText}</a>

            <div class="expiration-notice">
                ⏰ This invitation will expire in ${expirationDays} days. Please accept it before then to maintain access.
            </div>

            <p>Once you have access, you'll be able to:</p>
            <ul>
                <li>📊 View project updates and sprint progress</li>
                <li>📝 Receive automated changelog notifications</li>
                <li>💬 Collaborate with the project team</li>
                <li>📈 Track project milestones and deliverables</li>
            </ul>

            <p>If you have any questions about this invitation or the project, please contact ${invitedByName} or reply to this email.</p>
        </div>

        <div class="alternative-link">
            <strong>Having trouble with the button?</strong><br>
            Copy and paste this link into your browser:<br>
            ${invitationUrl}
        </div>

        <div class="footer">
            <p>This invitation was sent by ${invitedByName} via Agile Pulse.</p>
            <p>If you received this email in error, please ignore it.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generates plain text email template for customer invitation
   */
  static generateInvitationEmailText(data: InvitationEmailData): string {
    const {
      projectName,
      invitedByName,
      invitationUrl,
      isExistingCustomer,
      expirationDays,
    } = data;

    const welcomeMessage = isExistingCustomer
      ? `You've been invited to access the project "${projectName}" on Agile Pulse.`
      : `You've been invited to join Agile Pulse and access the project "${projectName}".`;

    const instructions = isExistingCustomer
      ? "Since you already have an account with us, simply visit the link below to accept the invitation and gain access to the project:"
      : "To accept this invitation and create your account, visit the link below:";

    return `
🚀 AGILE PULSE - PROJECT INVITATION

Hello!

${welcomeMessage}

PROJECT: ${projectName}
INVITED BY: ${invitedByName}

${instructions}

${invitationUrl}

⏰ IMPORTANT: This invitation will expire in ${expirationDays} days. Please accept it before then to maintain access.

Once you have access, you'll be able to:
• 📊 View project updates and sprint progress
• 📝 Receive automated changelog notifications
• 💬 Collaborate with the project team
• 📈 Track project milestones and deliverables

If you have any questions about this invitation or the project, please contact ${invitedByName} or reply to this email.

---
This invitation was sent by ${invitedByName} via Agile Pulse.
If you received this email in error, please ignore it.
    `.trim();
  }

  /**
   * Generates email subject line for customer invitation
   */
  static generateInvitationEmailSubject(
    projectName: string,
    _invitedByName: string
  ): string {
    return `🚀 You've been invited to ${projectName} on Agile Pulse`;
  }
}
