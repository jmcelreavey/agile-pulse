import { api } from "~/trpc/react";

export const useSprintDeadlineQueries = ({
  sprintId,
  projectId,
}: {
  sprintId: number;
  projectId: number;
}) => {
  function fetchDeadlineData(query: string) {
    return api.deadline.getAll.useSuspenseQuery({
      sprintId: sprintId,
      projectId: projectId,
      limit: 5,
      search: query,
    })[1];
  }

  return {
    fetchDeadlineData,
  };
};
