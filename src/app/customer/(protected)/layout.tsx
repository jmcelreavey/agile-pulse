import { ClientOnly } from "~/app/components/base/ClientOnly";
import { requireCustomer } from "~/server/guards";

export default async function CustomerPortalLayout({ children }: { children: React.ReactNode }) {
  await requireCustomer();
  return <ClientOnly>{children}</ClientOnly>;
}
