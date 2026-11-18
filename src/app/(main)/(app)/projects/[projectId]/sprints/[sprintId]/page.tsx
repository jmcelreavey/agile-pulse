import { SprintView } from "~/app/views/lazy";
import { DeleteSource } from "~/shared/types/DeleteSource";
import { api } from "~/trpc/server";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ sprintId: string; projectId: string }>;
  searchParams: Promise<{ zoomDay?: string }>;
}) {
  const { sprintId: sprintIdString, projectId: projectIdString } = await params;
  const { zoomDay: zoomDayString } = await searchParams;

  const sprintId = Number(sprintIdString);
  const projectId = Number(projectIdString);
  const zoomDay = zoomDayString ? Number(zoomDayString) : undefined;

  void api.project.getOne.prefetch({
    id: projectId,
  });
  void api.sprint.getOne.prefetch({
    id: sprintId,
    zoomDay,
  });
  void api.sprint.getTasks.prefetch({
    sprintId,
  });
  void api.sprint.getMembers.prefetch({
    sprintId,
    zoomDay,
  });
  void api.deleted.getDeletedRecords.prefetch({
    source: DeleteSource.SPRINT_TASK,
    sourceRelationId: sprintId,
  });

  void api.deleted.getDeletedRecords.prefetch({
    source: DeleteSource.SPRINT_MEMBER,
    sourceRelationId: sprintId,
  });

  void api.sprint.getDeadlines.prefetch({
    sprintId,
  });

  void api.sprint.getPrevious.prefetch({
    id: sprintId,
  });

  void api.sprint.getNext.prefetch({
    id: sprintId,
  });

  void api.sprint.getMemberMetrics.prefetch({
    sprintId,
  });

  void api.sprint.getMetrics.prefetch({
    sprintId,
  });

  void api.sprint.getOverrunningTasks.prefetch({
    sprintId,
  });

  // Prefetch customer data for changelog sharing
  void api.project.getCustomers.prefetch({
    projectId,
  });

  // Prefetch discussion comments for sprint discussion section
  void api.customer.getDiscussionComments.prefetch({
    projectId,
    sprintId,
  });

  // Prefetch Jira-related data for create/edit operations
  void api.jira.getConnectionStatus.prefetch();

  // Try to get project data to determine additional Jira prefetching needs
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

      // Try to get the sprint to see if it has a Jira sprint ID for issue prefetching
      try {
        const sprint = await api.sprint.getOne({ id: sprintId, zoomDay });
        if (sprint.jiraSprintId) {
          void api.jira.getSprintIssues
            .prefetch({
              sprintId: parseInt(sprint.jiraSprintId),
              cloudId: jiraConnectionStatus.cloudId,
            })
            .catch(() => {
              // Silently fail if Jira API is unavailable
            });
        }
      } catch {
        // Sprint fetch failed, skip issue prefetching
      }
    }
  } catch {
    // Project fetch failed, skip additional Jira prefetching
  }

  return (
    <SprintView sprintId={sprintId} projectId={projectId} zoomDay={zoomDay} />
  );
}
