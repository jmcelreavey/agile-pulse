# Authentication

Agile Pulse uses Auth.js (NextAuth v5) with JWT sessions. Sign-in options switch on from environment variables, so a fresh install works with no accounts set up at all.

## Sign-in options

| Option | Who it's for | Switched on by |
| --- | --- | --- |
| Demo account | Trying the app; the public demo | `DEMO_MODE`, or no Google sign-in configured |
| Google | Team members | `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` |
| Atlassian | Team members who want Jira import | `AUTH_JIRA_CLIENT_ID` and `AUTH_JIRA_CLIENT_SECRET` |
| Email and password | Customers invited to the [customer portal](CustomerPortal.md) | Always available to invited customers |

After signing in, team members land on their projects and customers on their portal dashboard. Team pages redirect customers to the portal and the portal redirects team members away.

## Project access

Team members see projects by email domain. A user with an `example.com` address sees the projects that belong to `example.com`. Customers see only the projects they were invited to.

## Tokens for tools

[MCP](MCP.md) clients don't use sign-in. They send a personal API token created on the **API tokens & MCP** page. Agile Pulse stores only a SHA-256 hash of each token, and a token acts with its owner's access.

## Public pages

The landing page, `/docs`, `/sign-in` and [shared sprint links](Sharing.md) need no account. Shared links reveal only the one sprint they were made for.

## Roles and permissions

All team members in a domain have the same permissions. Customers can read their projects and comment; they can't change the chart.
