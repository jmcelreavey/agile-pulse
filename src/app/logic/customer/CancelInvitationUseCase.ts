import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class CancelInvitationUseCase extends UseCase {
  public mutation = api.customer.cancelInvitation.useMutation();

  public async execute({
    invitationId,
    projectId,
  }: {
    invitationId: number;
    projectId: number;
  }) {
    try {
      this.setIsMutating(true);

      const result = await this.mutation.mutateAsync({
        invitationId,
        projectId,
      });

      // Invalidate project invitations to refresh the UI
      await this.useUtils.customer.getProjectInvitations.invalidate({
        projectId,
      });

      ShowNotificationUtil({
        title: "Invitation cancelled",
        message: `Successfully cancelled invitation for ${result.email}`,
      });

      return result;
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: "Failed to cancel invitation",
        message: errorMessage,
        isError: true,
      });
      throw error;
    } finally {
      this.setIsMutating(false);
    }
  }
}
