import { type NextRequest } from "next/server";
import { env } from "~/env";
import { db } from "~/server/db";
import { fromGitHub } from "~/server/integrations/events";
import { verifySha256Signature } from "~/server/integrations/signature";
import { ApplySyncEventUseCase } from "~/server/logic/insights/SyncUseCases";

/** GitHub webhook: pull_request, pull_request_review and issues events, signed with GITHUB_WEBHOOK_SECRET. */
export async function POST(request: NextRequest) {
  if (!env.GITHUB_WEBHOOK_SECRET) return Response.json({ error: "GitHub sync is not configured" }, { status: 404 });
  const body = await request.text();
  if (!(await verifySha256Signature(env.GITHUB_WEBHOOK_SECRET, body, request.headers.get("x-hub-signature-256")))) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }
  const eventName = request.headers.get("x-github-event");
  if (eventName === "ping") return Response.json({ ok: true, pong: true });
  const event = fromGitHub(eventName, JSON.parse(body) as Parameters<typeof fromGitHub>[1]);
  if (!event) return Response.json({ ok: true, ignored: true });
  return Response.json({ ok: true, ...(await new ApplySyncEventUseCase(db).execute(event)) });
}
