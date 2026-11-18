import { api } from "~/trpc/react";

interface DeveloperCommentsInput {
  projectId?: string;
  sprintId?: string;
}

export function useDeveloperComments(input: DeveloperCommentsInput) {
  const projectIdNum = input.projectId ? parseInt(input.projectId) : undefined;
  const sprintIdNum = input.sprintId ? parseInt(input.sprintId) : undefined;

  const [data, query] = api.customer.getDeveloperComments.useSuspenseQuery({
    projectId: projectIdNum!,
    sprintId: sprintIdNum,
  });

  return {
    data,
    isLoading: query.isRefetching,
    refetch: query.refetch,
  };
}

export function useCreateDeveloperComment() {
  const utils = api.useUtils();

  return api.customer.createDeveloperComment.useMutation({
    onSuccess: async (_, variables) => {
      // Invalidate developer comments queries
      const projectIdNum = variables.projectId;
      const sprintIdNum = variables.sprintId;

      await utils.customer.getDeveloperComments.invalidate({
        projectId: projectIdNum,
        sprintId: sprintIdNum,
      });

      // Invalidate unified discussion queries
      await utils.customer.getDiscussionComments.invalidate({
        projectId: projectIdNum,
        sprintId: sprintIdNum,
      });
    },
  });
}

export function useDeleteDeveloperComment() {
  const utils = api.useUtils();

  return api.customer.deleteDeveloperComment.useMutation({
    onSuccess: async () => {
      // Invalidate all developer comment and discussion queries
      await utils.customer.getDeveloperComments.invalidate();
      await utils.customer.getDiscussionComments.invalidate();
    },
  });
}
