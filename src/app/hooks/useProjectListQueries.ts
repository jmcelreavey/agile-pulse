import { DeleteSource } from "~/shared/types/DeleteSource";
import { api } from "~/trpc/react";

export const useProjectListQueries = () => {
  const [deletedRecords, getDeletedRecordsQuery] =
    api.deleted.getDeletedRecords.useSuspenseQuery({
      source: DeleteSource.PROJECT,
    });

  const [projects, getAllProjectsQuery] = api.project.getAll.useSuspenseQuery();

  return {
    projects,
    deletedRecords,
    isLoading:
      getAllProjectsQuery.isRefetching || getDeletedRecordsQuery.isRefetching,
  };
};
