import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class CreateInvitationUseCase extends UseCase {
  public mutation = api.customer.createInvitation.useMutation();

  public async execute({
    email,
    projectId,
  }: {
    email: string;
    projectId: number;
  }) {
    try {
      this.setIsMutating(true);

      const invitation = await this.mutation.mutateAsync({
        email,
        projectId,
      });

      // Invalidate project invitations to refresh the UI
      await this.useUtils.customer.getProjectInvitations.invalidate({
        projectId,
      });

      ShowNotificationUtil({
        title: "Invitation sent!",
        message: `Successfully sent invitation to ${email}`,
      });

      return invitation;
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: "Failed to send invitation",
        message: errorMessage,
        isError: true,
      });
      throw error;
    } finally {
      this.setIsMutating(false);
    }
  }
}
