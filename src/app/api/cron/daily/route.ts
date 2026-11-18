import { type NextRequest } from "next/server";
import { db } from "~/server/db";
import { DigestUseCase } from "~/server/logic/insights/DigestUseCase";
import { timingSafeEqual } from "~/server/integrations/signature";

declare global {
  // Set by worker.ts for the length of one scheduled run; the same isolate handles this request.
  var __agilePulseCronToken: string | undefined;
}

/**
 * The weekday job (stale PRs, standup digests). Only the Worker's own cron trigger can call it: it
 * passes a one-off token that exists in memory for that run, so no shared secret is needed.
 */
export async function POST(request: NextRequest) {
  const expected = globalThis.__agilePulseCronToken;
  const provided = request.headers.get("x-agile-pulse-cron") ?? "";
  if (!expected || !timingSafeEqual(expected, provided)) return Response.json({ error: "Forbidden" }, { status: 403 });
  return Response.json(await new DigestUseCase(db).runDaily());
}
