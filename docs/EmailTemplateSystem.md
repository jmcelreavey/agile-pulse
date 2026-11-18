# Email Template System

The email template system provides professional email formatting for changelog delivery to project customers.

## Features

- **Professional HTML Templates**: Beautiful, responsive email templates with consistent branding
- **Plain Text Fallback**: Automatic generation of plain text versions for email clients that don't support HTML
- **Customizable Content**: Templates support dynamic content injection including project details, changelog content, and customer information
- **Mobile Responsive**: Templates are optimized for mobile devices and various email clients
- **Email Service Integration**: Pluggable email service architecture supporting multiple providers

## Components

### EmailTemplateService

Main service for generating email templates:

```typescript
import { EmailTemplateService } from "~/server/email/EmailTemplateService";

const emailData = {
  projectName: "My Project",
  sprintName: "Sprint 23",
  changelogContent: "<h2>Features</h2><ul><li>New feature</li></ul>",
  customerName: "John Doe",
  generateDate: "December 15, 2024",
  sharedDate: "December 15, 2024",
};

// Generate HTML email
const htmlEmail = EmailTemplateService.generateChangelogEmailHtml(emailData);

// Generate plain text email
const textEmail = EmailTemplateService.generateChangelogEmailText(emailData);

// Generate subject line
const subject = EmailTemplateService.generateChangelogEmailSubject(
  "My Project",
  "Sprint 23"
);
```

### EmailService

Interface for email delivery:

```typescript
import { MockEmailService } from "~/server/email/EmailService";

const emailService = new MockEmailService();

await emailService.send({
  to: "customer@example.com",
  subject: "Sprint Changelog Update",
  html: htmlContent,
  text: textContent,
});
```

## Email Template Preview

You can preview email templates during development:

- **HTML Preview**: `GET /api/email/preview?format=html`
- **Text Preview**: `GET /api/email/preview?format=text`

## Configuration

### Production Email Service

To use a real email service in production, replace `MockEmailService` with an actual implementation:

```typescript
// Using Resend (recommended)
import { createEmailService } from "~/server/email/EmailService";

const emailService = createEmailService(process.env.RESEND_API_KEY, "Agile Pulse <noreply@example.com>");
```

### Environment Variables

Add these environment variables for production email:

```env
RESEND_API_KEY=your_resend_api_key
```

## Email Template Structure

The HTML email template includes:

- **Header**: Branding and title
- **Greeting**: Personalized customer greeting
- **Project Info**: Project and sprint details in a highlighted box
- **Changelog Content**: Formatted changelog with proper typography
- **Metadata**: Generation and sharing details
- **Footer**: Professional closing and branding

## Styling

The email templates use:

- System fonts for maximum compatibility
- Inline CSS for email client compatibility
- Responsive design with mobile breakpoints
- Professional color scheme with blue accents
- Proper spacing and typography for readability

## Future Enhancements

- **Custom Branding**: Allow projects to customize email branding
- **Email Analytics**: Track open rates and engagement
- **Template Variations**: Different templates for different types of updates
- **Internationalization**: Support for multiple languages
- **Rich Content**: Support for images and attachments in changelogs
