import { ProjectsView } from "~/app/views/lazy";
import { DeleteSource } from "~/shared/types/DeleteSource";
import { api, HydrateClient } from "~/trpc/server";

export default async function HomePage() {
  void api.project.getAll.prefetch();
  void api.deleted.getDeletedRecords.prefetch({
    source: DeleteSource.PROJECT,
  });

  // Prefetch Jira connection status for project creation/editing
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

  return (
    <HydrateClient>
      <ProjectsView />
    </HydrateClient>
  );
}
