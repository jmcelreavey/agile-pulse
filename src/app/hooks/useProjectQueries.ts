import { DeleteSource } from "~/shared/types/DeleteSource";
import { api } from "~/trpc/react";

export const useProjectQueries = ({ projectId }: { projectId: number }) => {
  const [deletedRecords, getDeletedRecordsQuery] =
    api.deleted.getDeletedRecords.useSuspenseQuery({
      source: DeleteSource.SPRINT,
      sourceRelationId: projectId,
    });

  const [sprints, getSprintsQuery] = api.project.getSprints.useSuspenseQuery({
    projectId,
  });

  const [project, getProjectQuery] = api.project.getOne.useSuspenseQuery({
    id: projectId,
  });

  return {
    sprints,
    project,
    deletedRecords,
    isLoading:
      getSprintsQuery.isRefetching ||
      getProjectQuery.isRefetching ||
      getDeletedRecordsQuery.isRefetching,
  };
};
