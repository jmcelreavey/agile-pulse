# GitHub and Jira sync

Tasks can be linked to GitHub pull requests and issues and to Jira issues. With webhooks set up, activity on the linked work moves the task along the chart by itself.

## Linking work

Open **Linked work** in a sprint's **Sprint insights** panel. Pick a task, paste a GitHub pull request, GitHub issue or Jira issue URL and press **Link**. Each link shows its status (open, draft, in review, merged, closed, done) and when it last changed. Links can be removed from the same table.

A task doesn't have to be linked by hand. If a pull request's title or branch contains a Jira key that matches a task, such as `PAY-104-saved-cards`, the webhook links it automatically. Tasks get Jira keys when they are imported from Jira.

## What the webhooks do

### GitHub

| Event | Link status | Task |
| --- | --- | --- |
| PR opened or reopened | Open | In progress |
| Review requested, or ready for review | In review | With QA |
| Converted to draft | Draft | In progress |
| PR merged | Merged | Completed |
| PR closed without merging | Closed | Unchanged: the work may move to another PR |
| Issue closed | Done | Completed |
| Issue reopened | Open | In progress |

GitHub never re-opens a completed task. Someone may have finished the work another way.

### Jira

Issue created and updated events map the issue's status to a task state: statuses containing "blocked" or "on hold" become Blocked, "QA", "test", "review" or "verify" become With QA, "sign-off", "approval" or "UAT" become Sign-off required. Otherwise the status category decides: To Do is Not started, In Progress is In progress and Done is Completed.

### Stale pull requests

Every weekday at 08:00 UTC the Worker's cron looks for open pull requests with no activity for `STALE_PR_DAYS` days (3 by default). Linked tasks that are not started or in progress are marked At Risk, and the [forecast](Forecast.md) lists the stale PR as a reason.

## Setting it up

1. Pick a long random secret, for example with `openssl rand -hex 32`.
2. Store it in the Worker: `npx wrangler secret put GITHUB_WEBHOOK_SECRET` (and/or `JIRA_WEBHOOK_SECRET`).
3. **GitHub**: in the repository or organisation settings, add a webhook with payload URL `https://<your-site>/api/webhooks/github`, content type `application/json`, the same secret, and the **Pull requests**, **Pull request reviews** and **Issues** events.
4. **Jira**: in **System → Webhooks**, add `https://<your-site>/api/webhooks/jira` with the same secret, for issue created and updated events.

The **Linked work** tab shows whether each webhook is on.

## Security

- Every request must carry an HMAC-SHA256 signature of the raw body made with your secret: GitHub's `X-Hub-Signature-256`, and Jira's `X-Hub-Signature` in the same `sha256=` form. Signatures are compared in constant time. Anything unsigned or wrongly signed gets a 401.
- When a secret isn't set, that webhook route returns 404, so an unconfigured install has nothing to attack.
- Webhooks only change tasks that are already linked or that carry a matching Jira key. They never create tasks.

## Why it works this way

- **Webhooks, not polling.** Polling GitHub for every task costs requests and rate limits. Webhooks are free and immediate, and they fit a Worker that sleeps between requests.
- **Merged means done.** For most teams a merged PR is the moment work is finished, so the chart follows reality without anyone updating it.
- **Stale is a signal, not a verdict.** A quiet PR doesn't always mean trouble, so it marks the task at risk and gives a reason rather than changing anything else.

## The demo

The demo's Checkout sprint is seeded with links to a fictional `agile-pulse-demo/checkout` repository: one merged PR, one in review, one open PR with no activity for five days (so its task shows as at risk) and a closed issue. Webhooks aren't configured on the demo, so the tab shows them as off.
