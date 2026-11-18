# Sharing and calendar

## Public read-only links

Share a sprint with someone who doesn't have an account. Open **Share** in a sprint's **Sprint insights** panel and press **Create a public link**. Anyone with the link sees:

- the sprint's chart, as read-only lanes,
- the [forecast](Forecast.md) status, pace, finish day and ETA,
- the at-risk tasks and their reasons,
- the sprint's deadlines.

They can't change anything or see other sprints. Links use a long random token and can be revoked from the same tab at any time. Shared pages tell search engines not to index them.

Try the demo's link: [/share/demo-checkout-sprint](/share/demo-checkout-sprint).

## Calendar feed

Each share link also has an iCal feed: `/api/calendar/<token>.ics`. Subscribe to it in Google Calendar, Outlook or Apple Calendar to see, for the whole project:

- every sprint's start and end,
- every [deadline](Deadlines.md),
- the forecast landing date of the sprint in progress.

Calendar apps refresh subscribed feeds on their own schedule, usually every few hours. Revoking the share link turns off its feed too.

## Why it works this way

- **Stakeholders don't need accounts.** A link is the easiest way to let a manager or another team glance at a sprint.
- **One token, two uses.** The calendar feed is keyed on the same token as the share link, so there's one thing to hand out and one thing to revoke.
- **Calendars are where dates live.** Putting deadlines and the forecast into the calendar people already check means nobody has to remember to open the app.
