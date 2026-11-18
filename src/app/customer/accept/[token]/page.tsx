import type { Metadata } from "next";
import CustomerAcceptInvitationView from "~/app/views/CustomerAcceptInvitationView";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Accept Project Invitation - Agile Pulse",
};

export default async function CustomerAcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  console.log("🔶 CustomerAcceptInvitationPage token:", token);

  // Prefetch validation query
  void api.customer.validateInvitation.prefetch({ token });

  return <CustomerAcceptInvitationView token={token} />;
}
