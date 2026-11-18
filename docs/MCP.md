# MCP endpoint

Agile Pulse has a remote [Model Context Protocol](https://modelcontextprotocol.io) endpoint. Connect Claude, Cursor, ChatGPT or any other MCP client and it can read your sprints and make changes, with the same access as you.

Ask things like "Which tasks in the Checkout sprint are at risk and why?", "Give me today's standup" or "Move Payment webhooks to Dev and mark it in progress".

## Connecting

1. Sign in and open **API tokens & MCP** from the user menu (`/settings`).
2. Create a token and copy it. It's shown once; Agile Pulse only stores a hash.
3. Add the server to your client. The settings page fills in your URL and token.

**Claude Code**

```bash
claude mcp add --transport http agile-pulse https://<your-site>/api/mcp --header "Authorization: Bearer ap_..."
```

**Cursor, Claude Desktop and other JSON configs**

```json
{
  "mcpServers": {
    "agile-pulse": {
      "url": "https://<your-site>/api/mcp",
      "headers": { "Authorization": "Bearer ap_..." }
    }
  }
}
```

Clients that only support local (stdio) servers can use a bridge such as `npx mcp-remote https://<your-site>/api/mcp --header "Authorization: Bearer ap_..."`.

## Tools

| Tool | What it does |
| --- | --- |
| `list_projects` | Projects with their state and number of sprints |
| `list_sprints` | Sprints, optionally for one project or one state |
| `get_sprint` | The chart: each lane's tasks in order, with linked PRs and issues |
| `get_forecast` | The [forecast](Forecast.md): landing day, pace, lanes and summary |
| `list_at_risk_tasks` | At-risk tasks with reasons, for one sprint or every sprint in progress |
| `get_standup` | The [standup digest](Standup.md) |
| `update_task` | Change a task's state, estimate or name |
| `move_task` | Move a task to another person's lane, optionally at a position |
| `add_task` | Add a task to a sprint, optionally on someone's lane |

Changes go through the same API as the app, with the same checks, so a task moved by an assistant behaves exactly like one moved by hand.

## Technical details

- **Transport**: Streamable HTTP, stateless. Every request is a `POST` of a JSON-RPC message or batch, answered with JSON. There are no sessions and no server-sent event stream, so `GET` and `DELETE` return 405.
- **Protocol versions**: 2025-06-18, 2025-03-26 and 2024-11-05.
- **Auth**: `Authorization: Bearer ap_...`. Missing or unknown tokens get a 401 with a `WWW-Authenticate: Bearer` header. Revoke a token on the settings page and it stops working at once.
- Each token records when it was last used.

## Why it works this way

- **Bring your own assistant.** People already have an AI assistant they like. Letting it work with Agile Pulse is more useful than adding another chat box, and it costs the app nothing to run.
- **Tokens, not OAuth.** A personal token is quick to set up and easy to revoke, and it needs no extra infrastructure. OAuth could be added later for clients that require it.
- **Stateless and SDK-free.** The handful of JSON-RPC methods MCP needs (`initialize`, `tools/list`, `tools/call`, `ping`) are small enough to implement directly. That keeps the Worker under Cloudflare's free-plan size limit and means any Worker instance can answer any request.

## The demo

The demo's tokens belong to the shared demo account and are deleted by the nightly reset. Anyone using the demo can see and revoke them, so don't connect anything you care about.
