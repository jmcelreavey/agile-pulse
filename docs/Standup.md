# Standup digest

The standup digest is a short written summary of the sprint for the daily standup. It covers what moved since the last snapshot, what each person is on today, who is away and what is blocked. Find it under **Standup** in a sprint's **Sprint insights** panel.

## What's in it

- **Headline**: the forecast's one-line summary of where the sprint stands.
- **Since day N**: tasks that changed state, finished, were added or changed hands since the previous snapshot.
- **Today**: each person's current task and what's next for them, or that they're away on leave.
- **Blockers and risks**: blocked and at-risk tasks, with the reason from the [forecast](Forecast.md).

Use **Copy** to paste it into a chat, or **Send now** to deliver it to the configured channels.

## Delivery to Slack and email

The digest can be sent automatically every weekday at 08:00 UTC by the Worker's cron. Each sprint in progress gets one message.

| Channel | Settings |
| --- | --- |
| Slack | `SLACK_WEBHOOK_URL`: an [incoming webhook](https://api.slack.com/messaging/webhooks) URL for the channel |
| Email | `RESEND_API_KEY` and `DIGEST_EMAIL_TO` (comma-separated addresses) |

With neither set, the cron still runs the other daily jobs (such as flagging [stale pull requests](Integrations.md)) and the digest is only shown in the app. The **Send now** button is disabled with a note saying what to set.

## How it is worked out

The digest compares the live chart with the most recent snapshot. A task counts as "moved" when its state changed, "added" when it wasn't in the snapshot and "reassigned" when it's on a different lane. Today's focus is the first unfinished task on each lane that has been started (or the first unfinished one if none has), and "next" is the one after it. Leave and distraction blocks covering today mark the person as away. No AI is involved.

## Why it works this way

- **Standups are about change.** Snapshots record exactly what changed, so the digest can start the conversation instead of everyone reciting their tickets.
- **Plain data, many outputs.** The digest is built once as data and then rendered for the app, Slack text and HTML email, so the three never disagree.
- **Slack webhooks and Resend are free** for this volume and need no app install or OAuth. The cron runs inside the same Worker, so it costs nothing extra on Cloudflare's free plan.
