import type { Metadata } from "next";
import { CustomerDashboardView } from "~/app/views/lazy";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Customer Dashboard - Agile Pulse",
};

export default async function CustomerDashboardPage() {
  // Prefetch customer projects
  void api.customer.getProjects.prefetch({});

  // Prefetch pending invitations
  void api.customer.getPendingInvitations.prefetch({});

  return <CustomerDashboardView />;
}
