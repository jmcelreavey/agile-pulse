import { ProjectView } from "~/app/views/lazy";
import { DeleteSource } from "~/shared/types/DeleteSource";
import { api } from "~/trpc/server";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId: projectIdString } = await params;
  const projectId = Number(projectIdString);
  void api.project.getOne.prefetch({ id: projectId });
  void api.project.getSprints.prefetch({
    projectId,
  });
  void api.deleted.getDeletedRecords.prefetch({
    source: DeleteSource.SPRINT,
    sourceRelationId: projectId,
  });

  // Prefetch discussion comments for project discussion section
  void api.customer.getDiscussionComments.prefetch({
    projectId,
  });

  // Prefetch Jira-related data for create/edit operations
  void api.jira.getConnectionStatus.prefetch();

  // Only prefetch Jira projects if user has a connection
  try {
    const jiraConnectionStatus = await api.jira.getConnectionStatus();
    if (jiraConnectionStatus?.isConnected && jiraConnectionStatus?.cloudId) {
      void api.jira.getProjects.prefetch();
    }
  } catch {
    // User doesn't have Jira connection, skip prefetching
  }

  // Try to get project data to determine if we should prefetch Jira sprints
  try {
    const project = await api.project.getOne({ id: projectId });
    const jiraConnectionStatus = await api.jira
      .getConnectionStatus()
      .catch(() => null);

    // If project is linked to Jira and user has connection, prefetch Jira sprints
    if (
      project.jiraProjectKey &&
      jiraConnectionStatus?.isConnected &&
      jiraConnectionStatus?.cloudId
    ) {
      void api.jira.getSprints
        .prefetch({
          projectKey: project.jiraProjectKey,
          cloudId: jiraConnectionStatus.cloudId,
        })
        .catch(() => {
          // Silently fail if Jira API is unavailable
        });
    }
  } catch {
    // Project fetch failed, skip additional Jira prefetching
  }

  return <ProjectView projectId={projectId} />;
}
