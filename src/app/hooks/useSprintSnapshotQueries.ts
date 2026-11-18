import { api } from "~/trpc/react";

export const useSprintSnapshotQueries = ({
  sprintId,
  projectId,
}: {
  sprintId: number;
  projectId: number;
}) => {
  const [project, getProjectQuery] = api.project.getOne.useSuspenseQuery({
    id: projectId,
  });

  const [previousSprint, getPreviousSprintQuery] =
    api.sprint.getPrevious.useSuspenseQuery({
      id: sprintId,
    });

  const [nextSprint, getNextSprintQuery] = api.sprint.getNext.useSuspenseQuery({
    id: sprintId,
  });

  const [sprintSnapshots, getSprintSnapshotsQuery] =
    api.snapshot.getSprintSnapshots.useSuspenseQuery({
      sprintId,
    });

  return {
    project,
    previousSprint:
      typeof previousSprint === "boolean" ? undefined : previousSprint,
    nextSprint: typeof nextSprint === "boolean" ? undefined : nextSprint,
    sprintSnapshots,
    isLoading:
      getProjectQuery.isRefetching ||
      getPreviousSprintQuery.isRefetching ||
      getNextSprintQuery.isRefetching ||
      getSprintSnapshotsQuery.isRefetching,
  };
};
