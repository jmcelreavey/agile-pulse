# Standardized Email Template System

This document describes the standardized email template system implemented in Agile Pulse for consistent, professional email communications.

## Overview

The email template system provides:

- Consistent branding and styling across all emails
- Professional HTML templates with mobile responsiveness
- Plain text fallbacks for accessibility
- Pluggable email service architecture
- Development preview capabilities

## Architecture

### Core Components

1. **EmailTemplateService** - Generates HTML and text templates
2. **EmailService** - Interface for sending emails (with mock and real implementations)
3. **Email Preview API** - Development endpoint for previewing templates

### File Structure

```
src/server/email/
├── EmailTemplateService.ts    # Template generation service
├── EmailService.ts           # Email sending service interface
└── README.md                # This documentation

src/app/api/email/
└── preview/
    └── route.ts             # Development preview endpoint
```

## Supported Email Types

### 1. Customer Invitations

**Purpose**: Invite customers to access projects
**Templates**: New customer registration vs. existing customer acceptance
**Use Cases**:

- Project collaboration invitations
- Customer onboarding
- Access management

### 2. Sprint Changelogs

**Purpose**: Share sprint updates with project stakeholders
**Templates**: Rich formatted changelog with project branding
**Use Cases**:

- Sprint completion notifications
- Project progress updates
- Stakeholder communication

## Usage

### Generating Customer Invitation Emails

```typescript
import {
  EmailTemplateService,
  type InvitationEmailData,
} from "~/server/email/EmailTemplateService";

const emailData: InvitationEmailData = {
  customerEmail: "customer@example.com",
  projectName: "My Project",
  invitedByName: "John Doe",
  invitationUrl: "https://app.com/invite/token123",
  isExistingCustomer: false,
  expirationDays: 7,
};

const htmlContent = EmailTemplateService.generateInvitationEmailHtml(emailData);
const textContent = EmailTemplateService.generateInvitationEmailText(emailData);
const subject = EmailTemplateService.generateInvitationEmailSubject(
  emailData.projectName,
  emailData.invitedByName
);
```

### Generating Changelog Emails

```typescript
import {
  EmailTemplateService,
  type ChangelogEmailData,
} from "~/server/email/EmailTemplateService";

const emailData: ChangelogEmailData = {
  projectName: "My Project",
  sprintName: "Sprint 23",
  changelogContent: "<h2>New Features</h2><ul><li>Feature 1</li></ul>",
  customerName: "John Smith",
  generateDate: "December 15, 2024",
  sharedDate: "December 15, 2024",
};

const htmlContent = EmailTemplateService.generateChangelogEmailHtml(emailData);
const textContent = EmailTemplateService.generateChangelogEmailText(emailData);
const subject = EmailTemplateService.generateChangelogEmailSubject(
  emailData.projectName,
  emailData.sprintName
);
```

### Sending Emails

```typescript
import { MockEmailService } from "~/server/email/EmailService";

const emailService = new MockEmailService();

const result = await emailService.send({
  to: "recipient@example.com",
  subject: "Your Subject",
  html: htmlContent,
  text: textContent,
  from: "Agile Pulse <noreply@example.com>",
});

if (result.success) {
  console.log("Email sent successfully:", result.messageId);
} else {
  console.error("Email failed:", result.error);
}
```

## Email Template Features

### Design Elements

- **Responsive Design**: Mobile-optimized layouts
- **Professional Branding**: Consistent Agile Pulse branding
- **Clear Typography**: Readable fonts and spacing
- **Action-Oriented**: Prominent call-to-action buttons
- **Accessible**: High contrast and screen reader friendly

### Content Structure

1. **Header**: Logo and email type identification
2. **Main Content**: Purpose-specific messaging
3. **Call-to-Action**: Primary action button/link
4. **Metadata**: Relevant dates, project info, etc.
5. **Footer**: Legal/contact information

## Development & Testing

### Preview Email Templates

Access the development preview at:

- Changelog: `/api/email/preview?template=changelog&format=html`
- New Customer Invitation: `/api/email/preview?template=invitation&format=html`
- Existing Customer Invitation: `/api/email/preview?template=invitation-existing&format=html`
- Text versions: Add `&format=text` to any URL

### Email Service Configuration

#### Development (Mock Service)

```typescript
import { MockEmailService } from "~/server/email/EmailService";
const emailService = new MockEmailService();
```

#### Production (Resend - Recommended)

```typescript
// Using Resend for production email sending
import { createEmailService } from "~/server/email/EmailService";
const emailService = createEmailService(process.env.RESEND_API_KEY, "Agile Pulse <noreply@example.com>");
```

## Migration from Legacy System

The following legacy components have been replaced:

### Before (Legacy)

- `EmailInvitationUseCase` - Basic email sending with plain text only
- Inconsistent styling and branding

### After (Standardized)

- `EmailTemplateService` - Professional HTML/text templates
- `EmailService` - Pluggable service architecture
- Consistent branding and mobile responsiveness

### Migration Steps

1. Update existing use cases to use `EmailTemplateService`
2. Replace manual email sending with `EmailService` interface
3. Test templates using the preview endpoint
4. Configure production email service

## Future Enhancements

- **Template Theming**: Customizable colors and branding per organization
- **Multi-language Support**: Internationalization for global teams
- **Email Analytics**: Open rates, click tracking, delivery status
- **Template Editor**: Visual template customization interface
- **A/B Testing**: Template performance comparison

## Troubleshooting

### Common Issues

1. **Missing Templates**: Ensure all required data fields are provided
2. **Email Delivery**: Check email service configuration and API keys
3. **Styling Issues**: Test on multiple email clients
4. **Mobile Rendering**: Use preview endpoint to verify responsive design

### Support

For questions or issues with the email template system:

1. Check the preview endpoint for template rendering
2. Verify email service configuration
3. Review console logs for error messages
4. Test with both HTML and text formats
