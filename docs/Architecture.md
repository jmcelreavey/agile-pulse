# Architecture

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
    demo/         daily reset of the shared demo data
    email/        email templates and the send-or-log email service
  shared/         code safe for both server and browser (types, pure utilities)
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

Changelog PDFs use the browser's print dialog ("Save as PDF"), so no server-side browser is needed.

## Demo data

`npm run demo:sql` builds a SQLite database by running the seed scenarios through the real tRPC API, then writes `.demo/demo.sql` with the schema, the data and a `tpl_` copy of each table. The Worker's daily cron (`0 4 * * *`) restores every table from its `tpl_` copy, so the shared demo returns to a clean state each day.
