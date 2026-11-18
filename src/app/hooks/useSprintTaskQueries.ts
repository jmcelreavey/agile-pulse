import { api } from "~/trpc/react";

export const useSprintTaskQueries = ({
  sprintId,
  projectId,
}: {
  sprintId: number;
  projectId: number;
}) => {
  function fetchMemberData(query: string) {
    return api.member.getAll.useSuspenseQuery({
      projectId: projectId,
      sprintId: sprintId,
      limit: 5,
      search: query,
    })[1];
  }

  function fetchTaskData(query: string) {
    return api.task.getAll.useSuspenseQuery({
      projectId: projectId,
      sprintId: sprintId,
      limit: 5,
      search: query,
    })[1];
  }

  function fetchSprintData(query: string) {
    return api.sprint.getAll.useSuspenseQuery({
      projectId: projectId,
      limit: 5,
      search: query,
    })[1];
  }

  return {
    fetchMemberData,
    fetchTaskData,
    fetchSprintData,
  };
};
