# Customer portal

The customer portal lets the people you build for follow their projects without seeing internal detail. Customers sign in with their own email and password, see the projects and sprints they've been given access to, read published changelogs and comment in each sprint's discussion.

## Inviting customers

A team member invites a customer by email from the project. The customer sets a password from the invitation link and can then see that project. Access is per project.

## What customers see

- Their projects and each project's sprints.
- Sprint progress: how many tasks are done, as a percentage and a list.
- **Expected delivery** for sprints in progress: a date and a confidence level (high, medium or low) from the [forecast](Forecast.md), plus the team's latest weekly update.
- Published [changelogs](Changelogs.md).
- The sprint discussion, where customers and the team can comment.

Customers don't see who is working on what, task estimates, at-risk reasons or anything from other projects.

## Weekly update

Under **Customer update** in a sprint's **Sprint insights** panel, Agile Pulse drafts a weekly update for customers:

- the ETA and confidence,
- how far through the sprint the team is,
- what was finished in the last five working days,
- what's in progress and what's coming up, by task name only.

Edit the draft as you like, with a live preview, then **Post to customer discussion** or copy it into an email. With an OpenAI key set, the draft is rewritten in a friendlier tone first; the facts and the ETA come from the built-in rules either way.

## How the ETA works

The ETA takes the forecast's remaining days and counts forward from today in working days, skipping weekends. Confidence is **high** when the sprint is on track with no high-severity risks, **low** when it's late or has three or more high-severity risks, and **medium** otherwise.

## Why it works this way

- **Customers want a date, not a burndown.** The ETA turns the forecast into the one thing a customer asks for, with an honest confidence level.
- **Drafted, not sent.** The team stays in charge of what customers read. The draft saves the writing; a person decides what goes out.
- **Names only.** Leaving out who did what and how long it took keeps the portal useful to customers and comfortable for the team.

## The demo

The demo has no customer login, so you can see the update and ETA under **Customer update** on the team side of any sprint in progress.
