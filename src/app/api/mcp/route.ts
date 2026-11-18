import { type NextRequest } from "next/server";
import { createCaller } from "~/server/api/root";
import { db } from "~/server/db";
import { ApiTokenUseCase } from "~/server/logic/insights/ApiTokenUseCase";
import { handleMcpBody } from "~/server/mcp/protocol";
import { mcpTools } from "~/server/mcp/tools";
import { site } from "~/shared/site";

const info = {
  name: "agile-pulse",
  version: "1.0.0",
  instructions:
    "Agile Pulse sprint tools. Start with list_sprints (state \"In Progress\"), then get_forecast or list_at_risk_tasks. get_sprint shows lanes and sprintTaskIds for update_task and move_task.",
};

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { ...(body === null ? {} : { "Content-Type": "application/json" }), "Cache-Control": "no-store", ...headers },
  });

/** Remote MCP endpoint (Streamable HTTP, stateless). Authenticate with `Authorization: Bearer ap_...`. */
export async function POST(request: NextRequest) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const user = await new ApiTokenUseCase(db).authenticate(bearer);
  if (!user) {
    return json({ jsonrpc: "2.0", id: null, error: { code: -32001, message: "Missing or invalid API token. Create one under API tokens in Agile Pulse." } }, 401, {
      "WWW-Authenticate": `Bearer realm="${site.url}/api/mcp"`,
    });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400);
  }
  const session = {
    expires: new Date(Date.now() + 60_000).toISOString(),
    user: { id: user.id, name: user.name, email: user.email, domain: user.domain ?? "", role: "user" as const },
  };
  const api = createCaller({ db, session, headers: request.headers });
  const reply = await handleMcpBody(body, mcpTools, { db, api }, info);
  return reply === null ? json(null, 202) : json(reply);
}

export function GET() {
  return json({ error: "This MCP endpoint is stateless: send JSON-RPC with POST. See /docs/mcp." }, 405, { Allow: "POST" });
}

export const DELETE = GET;
