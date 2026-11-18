# Configuration

Agile Pulse reads its settings from environment variables. Locally, put them in `.env` (see `.env.example`). On Cloudflare, set plain values under `vars` in `wrangler.jsonc` and secrets with `npx wrangler secret put <NAME>`.

Only `AUTH_SECRET` is required in production. Everything else is optional, and every feature has a built-in fallback when its setting is missing.

## Core

| Variable | Purpose | Default |
| --- | --- | --- |
| `AUTH_SECRET` | Signs session cookies. Generate with `openssl rand -base64 32` | Required in production |
| `SITE_URL` | The public URL, used in links, emails, the calendar feed and SEO tags | `http://localhost:3033` |
| `DEMO_MODE` | Shows the "Explore the demo" sign-in | Off |

## Sign-in

| Variable | Purpose |
| --- | --- |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google sign-in |
| `AUTH_JIRA_CLIENT_ID`, `AUTH_JIRA_CLIENT_SECRET` | Atlassian sign-in and Jira import ([Authentication](Authentication.md)) |

## AI

| Variable | Purpose | Without it |
| --- | --- | --- |
| `OPENAI_API_KEY` | Forecast "why", weekly update polish, planner estimates, changelogs | Built-in rules for all of them |
| `OPENAI_MODEL` | The model to use | `gpt-4o-mini` |

AI calls are short and time out after 10 seconds. Any failure falls back to the built-in result, so a bad key never breaks a screen.

## Email

| Variable | Purpose | Without it |
| --- | --- | --- |
| `RESEND_API_KEY` | Sends invitations, changelogs and digests through [Resend](https://resend.com) | Emails are logged, not sent |
| `EMAIL_FROM` | The sender | `Agile Pulse <noreply@example.com>` |

## Sync and digests

| Variable | Purpose | Without it |
| --- | --- | --- |
| `GITHUB_WEBHOOK_SECRET` | Verifies GitHub webhooks ([GitHub and Jira sync](Integrations.md)) | `/api/webhooks/github` returns 404 |
| `JIRA_WEBHOOK_SECRET` | Verifies Jira webhooks | `/api/webhooks/jira` returns 404 |
| `STALE_PR_DAYS` | Days without activity before an open PR counts as stale | `3` |
| `SLACK_WEBHOOK_URL` | Sends the weekday [standup digest](Standup.md) to Slack | Digest is in-app only |
| `DIGEST_EMAIL_TO` | Comma-separated addresses for the emailed digest (needs `RESEND_API_KEY`) | No digest email |

## Scheduled jobs

The Worker has two cron triggers in `wrangler.jsonc`:

| Schedule (UTC) | Job |
| --- | --- |
| `0 4 * * *` | Demo reset: restores each table from its `tpl_` copy. Does nothing on a database without those copies |
| `0 8 * * 1-5` | Flag stale pull requests, then send standup digests |

The weekday job calls the app's `/api/cron/daily` route inside the same Worker with a one-off token, so it needs no extra secret and can't be triggered from outside. Both fit within Cloudflare's free plan, which allows five cron triggers.

## Free-plan limits

The public demo runs entirely on Cloudflare's free plan: Workers, D1, Workers Assets and cron triggers. The main constraint is the 3 MiB compressed Worker size, which is why signed-in screens are loaded in the browser only and the MCP endpoint is written without an SDK. Slack incoming webhooks and Resend's free tier cover the digests. OpenAI is the only paid service, and it is optional.
