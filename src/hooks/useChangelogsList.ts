import { DeleteChangelogUseCase } from "~/app/logic/changelog/DeleteChangelogUseCase";
import { api } from "~/trpc/react";

export const useChangelogsList = (sprintId: number, projectId: number) => {
  const {
    data: changelogs,
    isLoading,
    error,
    refetch,
  } = api.changelog.getAll.useQuery({
    sprintId,
    projectId,
  });

  const deleteUseCase = new DeleteChangelogUseCase();

  const deleteChangelog = async (changelogId: number) => {
    await deleteUseCase.execute(changelogId);
  };

  return {
    changelogs: changelogs?.data || [],
    isLoading,
    error,
    refetch,
    deleteChangelog,
    isDeleting: deleteUseCase.isMutating,
  };
};
