import { db } from "~/server/db";
import { ShareLinkUseCase } from "~/server/logic/insights/ShareUseCases";

/** iCal feed for a share link: /api/calendar/<token>.ics */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ics = await new ShareLinkUseCase(db).calendar(token.replace(/\.ics$/i, ""));
  if (!ics) return new Response("Not found", { status: 404 });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="agile-pulse.ics"',
      "Cache-Control": "public, max-age=900",
    },
  });
}
