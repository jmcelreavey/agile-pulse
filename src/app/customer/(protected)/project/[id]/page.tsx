import type { Metadata } from "next";
import { CustomerProjectDetailView } from "~/app/views/lazy";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Project Details - Agile Pulse",
};

export default async function CustomerProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projectId = parseInt(id);

  // Prefetch project data for customer view
  void api.customer.getProjectDetails.prefetch({ projectId });

  // Prefetch discussion comments for project discussion section
  void api.customer.getDiscussionComments.prefetch({
    projectId,
  });

  return <CustomerProjectDetailView projectId={projectId} />;
}
