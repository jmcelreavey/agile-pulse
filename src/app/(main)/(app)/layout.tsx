import { ClientOnly } from "~/app/components/base/ClientOnly";
import { requireTeamMember } from "~/server/guards";

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  await requireTeamMember();
  return <ClientOnly>{children}</ClientOnly>;
}
