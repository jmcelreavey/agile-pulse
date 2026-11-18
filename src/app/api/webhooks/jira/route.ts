import { type NextRequest } from "next/server";
import { env } from "~/env";
import { db } from "~/server/db";
import { fromJira } from "~/server/integrations/events";
import { verifySha256Signature } from "~/server/integrations/signature";
import { ApplySyncEventUseCase } from "~/server/logic/insights/SyncUseCases";

/** Jira Cloud webhook (issue created or updated), signed with JIRA_WEBHOOK_SECRET via X-Hub-Signature. */
export async function POST(request: NextRequest) {
  if (!env.JIRA_WEBHOOK_SECRET) return Response.json({ error: "Jira sync is not configured" }, { status: 404 });
  const body = await request.text();
  if (!(await verifySha256Signature(env.JIRA_WEBHOOK_SECRET, body, request.headers.get("x-hub-signature")))) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }
  const event = fromJira(JSON.parse(body) as Parameters<typeof fromJira>[0]);
  if (!event) return Response.json({ ok: true, ignored: true });
  return Response.json({ ok: true, ...(await new ApplySyncEventUseCase(db).execute(event)) });
}
