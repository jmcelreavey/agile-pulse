import { api } from "~/trpc/react";

export function useDeleteCustomerComment() {
  const utils = api.useUtils();
  
  return api.customer.deleteComment.useMutation({
    onSuccess: async () => {
      // Invalidate all customer comment and discussion queries
      await utils.customer.getComments.invalidate();
      await utils.customer.getProjectComments.invalidate();
      await utils.customer.getDiscussionComments.invalidate();
    },
  });
}
