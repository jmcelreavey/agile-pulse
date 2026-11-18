import { CustomerSprintView } from "~/app/views/lazy";
import { api } from "~/trpc/server";

export default async function CustomerSprintPage({
  params,
}: {
  params: Promise<{ sprintId: string; id: string }>;
}) {
  const { sprintId: sprintIdString, id: projectIdString } = await params;

  const sprintId = Number(sprintIdString);
  const projectId = Number(projectIdString);

  // Prefetch data for the customer sprint view
  void api.customer.getProjectDetails.prefetch({
    projectId,
  });

  // Prefetch sprint details for the customer sprint view
  void api.customer.getSprintDetails.prefetch({
    projectId,
    sprintId,
  });

  // Prefetch discussion comments for sprint discussion section
  void api.customer.getDiscussionComments.prefetch({
    projectId,
    sprintId,
  });

  return <CustomerSprintView sprintId={sprintId} projectId={projectId} />;
}
