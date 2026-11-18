import { api } from "~/trpc/react";

export const useCustomerCommentQueries = ({
  projectId,
  sprintId,
}: {
  projectId: number;
  sprintId?: number;
}) => {
  const [comments, commentsQuery] = api.customer.getComments.useSuspenseQuery(
    { projectId, sprintId },
    {
      retry: false,
    }
  );

  return {
    comments,
    isLoading: commentsQuery.isRefetching,
    refetch: commentsQuery.refetch,
  };
};

// Hook for team members to view customer comments
export const useProjectCommentQueries = ({
  projectId,
  sprintId,
}: {
  projectId: number;
  sprintId?: number;
}) => {
  const [comments, commentsQuery] =
    api.customer.getProjectComments.useSuspenseQuery(
      { projectId, sprintId },
      {
        retry: false,
      }
    );

  return {
    comments,
    isLoading: commentsQuery.isRefetching,
    refetch: commentsQuery.refetch,
  };
};
