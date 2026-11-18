import { api } from "~/trpc/react";

export const useCustomerSprintDetailQueries = ({
  projectId,
  sprintId,
}: {
  projectId: number;
  sprintId: number;
}) => {
  const [sprint, isSprintLoading] =
    api.customer.getSprintDetails.useSuspenseQuery({
      projectId,
      sprintId,
    });

  return {
    sprint,
    isLoading: isSprintLoading.isRefetching,
  };
};
