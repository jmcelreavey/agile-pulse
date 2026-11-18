import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { SharedSprintView } from "~/app/components/insights/SharedSprintView";
import { db } from "~/server/db";
import { ShareLinkUseCase } from "~/server/logic/insights/ShareUseCases";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

const load = async (token: string) => new ShareLinkUseCase(db).getShared(token);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shared = await load((await params).token);
  return {
    title: shared ? `${shared.sprint.projectName}: Sprint ${shared.sprint.reference}` : "Shared sprint",
    robots: { index: false, follow: false },
  };
}

export default async function SharedSprintPage({ params }: Props) {
  const shared = await load((await params).token);
  if (!shared) notFound();
  return <SharedSprintView data={JSON.parse(JSON.stringify(shared)) as typeof shared} />;
}
