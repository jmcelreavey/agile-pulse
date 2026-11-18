import type { Metadata } from "next";
import CustomerRegistrationView from "~/app/views/CustomerRegistrationView";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Create Customer Account - Agile Pulse",
};

export default async function CustomerRegistrationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  console.log("🔶 CustomerRegistrationPage token:", token);

  // Prefetch validation query
  void api.customer.validateInvitation.prefetch({ token });

  return <CustomerRegistrationView token={token} />;
}
