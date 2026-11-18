export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailService {
  send(message: EmailMessage): Promise<EmailSendResult>;
}

/** Logs instead of sending. Used when no email provider is configured (local dev, the public demo). */
export class LogEmailService implements EmailService {
  async send(message: EmailMessage): Promise<EmailSendResult> {
    console.info(`[email disabled] "${message.subject}" was not sent (no RESEND_API_KEY set).`);
    return { success: true, messageId: `logged-${crypto.randomUUID()}` };
  }
}

/** Sends through the Resend HTTP API. Works in Node and on Cloudflare Workers. */
export class ResendEmailService implements EmailService {
  constructor(
    private readonly apiKey: string,
    private readonly defaultFrom: string
  ) {}

  async send(message: EmailMessage): Promise<EmailSendResult> {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: message.from ?? this.defaultFrom,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
          ...(message.replyTo ? { reply_to: message.replyTo } : {}),
        }),
      });
      const data = (await response.json()) as { id?: string; message?: string };
      if (!response.ok) {
        return { success: false, error: data.message ?? `Resend returned ${response.status}` };
      }
      return { success: true, messageId: data.id ?? "unknown" };
    } catch (error) {
      console.error("Resend email error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
}

/** The configured email service: Resend when a key is set, otherwise a logger. */
export function createEmailService(apiKey: string | undefined, from: string): EmailService {
  return apiKey ? new ResendEmailService(apiKey, from) : new LogEmailService();
}
