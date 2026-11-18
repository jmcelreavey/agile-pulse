# Overview and rationale

Agile Pulse shows a sprint as a chart of people against days. Each task is a block on someone's lane, sized by its estimate and coloured by its state. You can see who is on what, what is slipping and whether the sprint will land without opening a single ticket.

This page explains what the app does, how the parts fit together and why it is built the way it is.

## Where it came from

Agile Pulse was built before AI tools were part of everyday development. It was a response to a common problem: ticket boards are good at listing work but bad at showing time. A column of "In Progress" cards doesn't tell you that one person has eight days of work in a ten-day sprint and a day of leave on Thursday. A chart of lanes does.

The original app covered planning and tracking:

- [Projects](Projects.md), [Sprints](Sprints.md) and [Members](Members.md)
- the [Sprint chart](Chart.md), with drag and drop, zoom and overruns
- [Tasks](Tasks.md) and their states
- [Deadlines](Deadlines.md) on the timeline
- [Snapshots](Snapshots.md) of the chart each time the day marker moves
- the [Dashboard](Dashboard.md), [Archives](Archives.md) and [Changelogs](Changelogs.md)
- the [Customer portal](CustomerPortal.md) and optional [Jira](Integrations.md) sync

## What changed: AI without becoming a chatbot

The second round of work added AI, with one rule: **AI may write up an answer, but it never decides the answer.** Every new feature works out its result with plain, tested code first. When an OpenAI key is set, a model may turn that result into a nicer sentence or fill a gap the rules can't, such as guessing an estimate for an item that has none.

That rule exists for four reasons:

1. **The data already holds the answer.** Daily snapshots record exactly how the sprint went. A forecast or a retro prompt can be worked out from them directly, and a person can check the working.
2. **It has to work without a key.** The public demo has no AI key and runs on Cloudflare's free plan. Every feature does something useful there.
3. **It should be predictable.** The same chart gives the same forecast every time. Teams stop trusting a tool whose numbers change when you refresh.
4. **It is cheaper and faster.** Most screens make no AI calls at all. The few that can are one short request each, and they fall back to the built-in text when the call fails.

Each AI-assisted answer carries a small badge saying whether it came from the built-in rules or from OpenAI.

| Feature | Built-in result | What AI adds, when a key is set |
| --- | --- | --- |
| [Forecast](Forecast.md) | Landing day, pace, at-risk tasks and reasons | A one-sentence "why" |
| [Standup digest](Standup.md) | The whole digest | Nothing |
| [Retro prompts](Retro.md) | Evidence and questions | Nothing |
| [Sprint planner](Planner.md) | The full allocation | Estimates for items that have none |
| [Weekly customer update](CustomerPortal.md) | A full draft and ETA | A friendlier rewrite of the draft |
| [Changelogs](Changelogs.md) | Release notes grouped by type | A written-up version |

The other big addition goes the other way. Instead of putting a chatbot inside Agile Pulse, the [MCP endpoint](MCP.md) lets the assistant you already use (Claude, Cursor, ChatGPT) read and update your sprints. The app stays a planning tool, and the AI lives where you already work.

## What's new

- [Sprint forecast](Forecast.md): when the sprint will land and which tasks are at risk, from the chart and its snapshots.
- [GitHub and Jira sync](Integrations.md): link tasks to pull requests and issues; signed webhooks move tasks along, and stale PRs are flagged.
- [Standup digest](Standup.md): yesterday's moves, today's focus and blockers, in the app or sent to Slack and email.
- [Sprint planner](Planner.md): paste a backlog and get it laid out by capacity, leave and past velocity.
- [Retro prompts](Retro.md): discussion points drawn from the sprint's replay.
- [MCP endpoint](MCP.md): connect an AI assistant with a personal token.
- [Customer portal](CustomerPortal.md) updates: a drafted weekly update and a forecast-based ETA.
- [Sharing and calendar](Sharing.md): public read-only links and an iCal feed of deadlines.
- [Accessibility](Accessibility.md): keyboard task moves and a dark mode that follows your system.

## How it's built

Agile Pulse is a Next.js app with a tRPC API and Prisma on Cloudflare D1, deployed to Cloudflare Workers. See [Architecture](Architecture.md) for the details and [Configuration](Configuration.md) for every setting. Everything is optional except `AUTH_SECRET`; with nothing else set, you get the full app with the demo account and the built-in rules.
