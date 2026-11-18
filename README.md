# Agile Pulse

Sprint planning you can see at a glance. Agile Pulse lays each sprint out as a chart of people against days, so you can tell in a few seconds who is on what, what is at risk and whether the sprint will land.

**[Try the live demo](https://agile-pulse-demo.j-mcelreavey.workers.dev)**: no account needed, press "Explore the demo". The demo workspace is shared and resets every day.

![The sprint chart for an in-progress sprint](docs/screenshots/sprint-chart.png)

## Features

- **Sprint chart.** Tasks are blocks on each member's lane across the sprint's working days, coloured by state (not started, in progress, with QA, at risk, done). Drag tasks to reorder them or move them between people, zoom into days, and see overruns past the sprint end.
- **Current day and snapshots.** Progress the current-day marker and Agile Pulse stores a snapshot of the chart, so you can step back through how the sprint actually went.
- **Deadlines.** Mark quality days, releases and other milestones on the timeline.
- **Projects and sprints.** Group sprints under projects, carry unfinished tasks into the next sprint, and archive and restore anything.
- **Customer portal.** Invite customers to follow progress on their projects, read published updates and comment, without seeing internal detail.
- **Changelogs.** Turn completed tasks into release notes, edit them in a rich text editor, share them with customers by email or save them as PDF. Uses OpenAI when a key is set and a built-in writer otherwise.
- **Jira.** Optionally sign in with Atlassian and pull sprints and issues from Jira.

| Projects | Project overview |
| --- | --- |
| ![Projects list](docs/screenshots/projects.png) | ![A project and its sprints](docs/screenshots/project.png) |

## Run it locally

Requirements: Node.js 22 or newer.

```bash
git clone https://github.com/jmcelreavey/agile-pulse.git
cd agile-pulse
npm install
npm run demo:sql                                              # build the demo data
npx wrangler d1 execute agile-pulse-demo --local --file=.demo/demo.sql
npm run dev                                                   # http://localhost:3033
```

No keys are needed. `npm run dev` uses a local D1 database through Wrangler, and you sign in with the demo account. To switch on Google or Jira sign-in, AI changelogs or email, copy `.env.example` to `.env` and fill in the values you need.

```bash
npm run check     # typecheck, lint and unit tests
npm run build     # production build
```

## Deploy to Cloudflare

Agile Pulse runs on Cloudflare Workers with a D1 database, which fits in Cloudflare's free tier for a demo.

```bash
npx wrangler d1 create agile-pulse-demo          # put the id in wrangler.jsonc
openssl rand -base64 32 | npx wrangler secret put AUTH_SECRET
npm run cf:deploy
npm run cf:db:reset                              # load the demo data into D1
```

Set `SITE_URL` in `wrangler.jsonc` to your Worker's URL. Optional integrations are set with `npx wrangler secret put <NAME>`, using the names in `.env.example`.

## How it's built

Next.js 16, React 19, tRPC 11, Prisma 7 on Cloudflare D1, Auth.js, Mantine 9 and Tiptap, deployed with OpenNext for Cloudflare. See [docs/Architecture.md](docs/Architecture.md) for the layout, data access, soft delete and demo reset, and the other files in [docs](docs) for each feature.

## Licence

[MIT](LICENSE) © John McElreavey
