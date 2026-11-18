# Architecture

How Agile Pulse is put together: the stack, the folder layout, data access, the insights logic and the demo.

## Stack

- **Next.js 16** (App Router, React 19, React Compiler in annotation mode)
- **tRPC 11** for a typed API between the server and the UI (`src/server/api`)
- **Prisma 7** with driver adapters. The app uses **Cloudflare D1** (SQLite) through `@prisma/adapter-d1`; seed scripts use a Node.js build of the same client with `better-sqlite3`.
- **Auth.js (NextAuth v5)** with JWT sessions. Providers switch on from environment variables: the demo account, Google, Atlassian (Jira) and customer email/password logins.
- **Mantine 9** for the UI, Tiptap for rich text.
- **Cloudflare Workers** via `@opennextjs/cloudflare`, with static assets served by Workers Assets.

## Layout

```
src/
  app/            routes, views, client components and client-side use cases
  server/
    api/          tRPC routers and input schemas
    logic/        server use cases, one class per operation
    db/           Prisma client per request, soft delete extension
    ai/           the single OpenAI helper, which returns null without a key
    demo/         daily reset of the shared demo data
    email/        email templates and the send-or-log email service
    integrations/ webhook signature checks and GitHub/Jira event mapping
    mcp/          the MCP JSON-RPC handler and its tools
  shared/         code safe for both server and browser (types, pure utilities)
    logic/insights/  forecast, standup, retro, planner, weekly update and iCal, as pure functions
  seeding/        factories and scenarios that build the demo data through the real API
scripts/          demo SQL export
worker.ts         Worker entry: OpenNext request handler plus the reset cron
```

## Data access

`src/server/db` exposes `db`, a handle that resolves the Prisma client for the current request from the D1 binding. Use cases receive it in their constructor, which keeps them easy to test with a mocked client.

### Soft delete

Archiving a project, sprint, member or task creates a `DeleteRecord` and sets `deletedRecordId` on every affected row. A Prisma client extension (`src/server/db/softDelete.ts`) adds `deletedRecordId: null` to reads of those models and to to-many includes of them, unless the query already filters on `deletedRecordId`, which is how the archive screens list archived rows. Restoring clears the field.

### Transactions on D1

D1 doesn't support interactive transactions, so Prisma runs `$transaction` blocks as individual statements there. The code keeps its transactions so it stays correct on databases that do support them.

## Optional integrations

All integrations are optional and detected from the environment (`src/env.ts`):

| Integration | Variables | Without it |
| --- | --- | --- |
| Google sign-in | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Demo account sign-in |
| Jira sign-in and sync | `AUTH_JIRA_CLIENT_ID`, `AUTH_JIRA_CLIENT_SECRET` | Jira features stay hidden |
| AI changelogs | `OPENAI_API_KEY` | Built-in rule-based changelog writer |
| Email | `RESEND_API_KEY` | Emails are logged, not sent |
| GitHub and Jira webhooks | `GITHUB_WEBHOOK_SECRET`, `JIRA_WEBHOOK_SECRET` | Webhook routes return 404 |
| Standup digest | `SLACK_WEBHOOK_URL`, `DIGEST_EMAIL_TO` | Digest is shown in the app only |

[Configuration](Configuration.md) lists every variable.

Changelog PDFs use the browser's print dialog ("Save as PDF"), so no server-side browser is needed.

## Sprint insights

The forecast, standup, retro, planner and weekly update are pure functions in `src/shared/logic/insights`. They take a `ChartState` (lanes of tasks in order, the current day and the sprint length) plus the history of snapshots, and return plain data. `LoadSprintChartUseCase` builds those inputs from the database, and `SprintInsightsUseCase` calls the functions and, where it helps, asks OpenAI to write up the result. Keeping the logic pure means it is unit tested without a database and gives the same answer in the app, the API, MCP and the cron.

See [Overview and rationale](Overview.md) for why AI only writes up results and never decides them.

## Public routes

| Route | What it is |
| --- | --- |
| `/docs` | This documentation, generated from `docs/*.md` |
| `/share/<token>` | A read-only sprint ([Sharing](Sharing.md)) |
| `/api/calendar/<token>.ics` | The iCal feed for a share link |
| `/api/mcp` | The MCP endpoint, bearer token required ([MCP](MCP.md)) |
| `/api/webhooks/github`, `/api/webhooks/jira` | Signed webhooks ([Sync](Integrations.md)) |
| `/api/cron/daily` | The weekday job, callable only from the Worker's own cron |

## Documentation

The `/docs` pages are generated from the markdown files in `docs/`. After editing them, run `npm run docs:build` to regenerate `src/shared/docs/generated.ts`. A unit test fails if the two are out of sync. Links between files, such as `(Forecast.md)`, become links between pages.

## Demo data

`npm run demo:sql` builds a SQLite database by running the seed scenarios through the real tRPC API, then writes `.demo/demo.sql` with the schema, the data and a `tpl_` copy of each table. The Worker's daily cron (`0 4 * * *`) restores every table from its `tpl_` copy, so the shared demo returns to a clean state each day. A second cron (`0 8 * * 1-5`) runs the weekday job: it flags stale pull requests and sends standup digests.
