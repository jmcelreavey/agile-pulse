import { env, integrations } from "~/env";
import { createEmailService } from "~/server/email/EmailService";
import { SprintInsightsUseCase } from "~/server/logic/insights/SprintInsightsUseCase";
import { MarkStalePullRequestsUseCase } from "~/server/logic/insights/SyncUseCases";
import { UseCase } from "~/server/logic/useCase";
import { standupToHtml, standupToText } from "~/shared/logic/insights/standup";
import { State } from "~/shared/types/State";

export type DeliveryResult = { slack: "sent" | "failed" | "off"; email: "sent" | "failed" | "off" };

/** Deliver standup digests to Slack (incoming webhook) and email (Resend), when configured. */
export class DigestUseCase extends UseCase {
  async deliver(sprintId: number): Promise<DeliveryResult & { text: string }> {
    const { sprint, standup } = await new SprintInsightsUseCase(this.db).standup(sprintId);
    const title = `${sprint.projectName}, Sprint ${sprint.reference}`;
    const text = standupToText(standup, title);
    const result: DeliveryResult = { slack: "off", email: "off" };

    if (integrations.slackDigest && env.SLACK_WEBHOOK_URL) {
      try {
        const response = await fetch(env.SLACK_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        result.slack = response.ok ? "sent" : "failed";
      } catch {
        result.slack = "failed";
      }
    }
    if (integrations.emailDigest && env.DIGEST_EMAIL_TO) {
      const email = createEmailService(env.RESEND_API_KEY, env.EMAIL_FROM);
      const recipients = env.DIGEST_EMAIL_TO.split(",").map((value) => value.trim()).filter(Boolean);
      const sent = await Promise.all(
        recipients.map((to) => email.send({ to, subject: `Standup: ${title}, day ${standup.day}`, text, html: standupToHtml(standup, title) }))
      );
      result.email = sent.every((r) => r.success) ? "sent" : "failed";
    }
    if (result.slack === "off" && result.email === "off") {
      console.info(`[digest] ${title}: no Slack webhook or digest email configured, so it was not sent.`);
    }
    return { ...result, text };
  }

  /** The weekday cron job: flag stale PRs, then send a digest for every sprint in progress. */
  async runDaily() {
    const stale = await new MarkStalePullRequestsUseCase(this.db).execute(env.STALE_PR_DAYS);
    const sprints = await this.db.sprint.findMany({
      where: { state: State.IN_PROGRESS, snapshotId: null },
      select: { id: true },
      take: 25,
    });
    const delivered = [];
    for (const sprint of sprints) {
      const { slack, email } = await this.deliver(sprint.id);
      delivered.push({ sprintId: sprint.id, slack, email });
    }
    return { stale, delivered };
  }
}
