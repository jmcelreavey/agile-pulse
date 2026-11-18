import { api } from "~/trpc/react";

interface DiscussionCommentsInput {
  projectId?: string;
  sprintId?: string;
}

export function useDiscussionComments(input: DiscussionCommentsInput) {
  const projectIdNum = input.projectId ? parseInt(input.projectId) : undefined;
  const sprintIdNum = input.sprintId ? parseInt(input.sprintId) : undefined;

  const [data, query] = api.customer.getDiscussionComments.useSuspenseQuery({
    projectId: projectIdNum!,
    sprintId: sprintIdNum,
  });

  return {
    data,
    isLoading: query.isRefetching,
    refetch: query.refetch,
  };
}
