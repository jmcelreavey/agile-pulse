import { DeleteSource } from "~/shared/types/DeleteSource";
import { State } from "~/shared/types/State";
import { api } from "~/trpc/react";

export const useSprintQueries = ({
  sprintId,
  projectId,
  zoomDay,
}: {
  sprintId: number;
  projectId: number;
  zoomDay?: number;
}) => {
  const [deletedTaskRecords, getDeletedTaskRecordsQuery] =
    api.deleted.getDeletedRecords.useSuspenseQuery({
      source: DeleteSource.SPRINT_TASK,
      sourceRelationId: sprintId,
    });
  const [deletedMemberRecords, getDeletedMemberRecordsQuery] =
    api.deleted.getDeletedRecords.useSuspenseQuery({
      source: DeleteSource.SPRINT_MEMBER,
      sourceRelationId: sprintId,
    });
  const [sprint, getSprintQuery] = api.sprint.getOne.useSuspenseQuery({
    id: sprintId,
    zoomDay,
  });
  const [sprintMembers, getMembersQuery] =
    api.sprint.getMembers.useSuspenseQuery({
      sprintId,
      zoomDay,
    });
  const [sprintTasks, getSprintTasksQuery] =
    api.sprint.getTasks.useSuspenseQuery({
      sprintId,
    });
  const [project, getProjectQuery] = api.project.getOne.useSuspenseQuery({
    id: projectId,
  });
  const [sprintDeadlines, getSprintDeadlinesQuery] =
    api.sprint.getDeadlines.useSuspenseQuery({
      sprintId,
    });

  const [previousSprint, getPreviousSprintQuery] =
    api.sprint.getPrevious.useSuspenseQuery({
      id: sprintId,
    });

  const [nextSprint, getNextSprintQuery] = api.sprint.getNext.useSuspenseQuery({
    id: sprintId,
  });

  const [memberMetrics, getMemberMetricsQuery] =
    api.sprint.getMemberMetrics.useSuspenseQuery({
      sprintId: sprintId,
    });

  const [metrics, getMetricsQuery] = api.sprint.getMetrics.useSuspenseQuery({
    sprintId: sprintId,
  });

  const [overrunningTasks, getOverrunningTasksQuery] =
    api.sprint.getOverrunningTasks.useSuspenseQuery({
      sprintId,
    });

  // Jira-related queries
  const jiraConnectionStatus = api.jira.getConnectionStatus.useQuery();

  // Check if Jira sync is available
  const canSyncWithJira = () => {
    return (
      jiraConnectionStatus.data?.isConnected && // User has linked Jira account
      jiraConnectionStatus.data?.cloudId && // User has configured cloud ID
      project.jiraProjectKey && // Project is linked to Jira
      sprint.state !== State.COMPLETED && // Sprint is not completed
      sprint.jiraSprintId // Sprint has a Jira sprint ID
    );
  };

  // Get Jira sprint issues count for sync preview
  const jiraIssuesQuery = api.jira.getSprintIssues.useQuery(
    {
      sprintId: parseInt(sprint.jiraSprintId ?? "0"),
      cloudId: jiraConnectionStatus.data?.cloudId ?? "",
    },
    {
      enabled: Boolean(
        sprint.jiraSprintId &&
          jiraConnectionStatus.data?.cloudId &&
          canSyncWithJira()
      ),
    }
  );

  // Calculate how many new tasks would be created (excluding existing ones)
  const calculateNewTasksCount = () => {
    if (
      !jiraIssuesQuery.data ||
      jiraIssuesQuery.isLoading ||
      jiraIssuesQuery.isFetching
    )
      return undefined;

    const existingJiraKeys = new Set(
      sprintTasks.map((st) => st.jiraIssueKey).filter(Boolean)
    );

    return jiraIssuesQuery.data.filter(
      (issue) => !existingJiraKeys.has(issue.key)
    ).length;
  };

  const unassignedTasks = sprintTasks.filter((task) => !task.sprintMemberId);

  return {
    project,
    sprint,
    sprintMembers,
    sprintTasks,
    unassignedTasks,
    deletedTaskRecords,
    deletedMemberRecords,
    sprintDeadlines,
    overrunningTasks,
    previousSprint:
      typeof previousSprint === "boolean" ? undefined : previousSprint,
    nextSprint: typeof nextSprint === "boolean" ? undefined : nextSprint,
    memberMetrics,
    metrics,
    // Jira-related data
    jiraConnectionStatus,
    jiraIssuesQuery,
    canSyncWithJira: canSyncWithJira(),
    calculateNewTasksCount,
    isLoading:
      getSprintQuery.isRefetching ||
      getProjectQuery.isRefetching ||
      getMembersQuery.isRefetching ||
      getSprintTasksQuery.isRefetching ||
      getDeletedTaskRecordsQuery.isRefetching ||
      getDeletedMemberRecordsQuery.isRefetching ||
      getSprintDeadlinesQuery.isRefetching ||
      getPreviousSprintQuery.isRefetching ||
      getNextSprintQuery.isRefetching ||
      getMemberMetricsQuery.isRefetching ||
      getMetricsQuery.isRefetching ||
      getOverrunningTasksQuery.isRefetching,
  };
};
