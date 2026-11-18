import { notifications } from "@mantine/notifications";
import { api } from "~/trpc/react";

export class AcceptInvitationFromDashboardUseCase {
  private acceptInvitationMutation = api.customer.acceptInvitationFromDashboard.useMutation();

  get isMutating() {
    return this.acceptInvitationMutation.isPending;
  }

  async execute(input: { invitationId: number }) {
    try {
      const result = await this.acceptInvitationMutation.mutateAsync(input);
      
      notifications.show({
        title: "Success!",
        message: result.message,
        color: "green",
      });

      // Refresh the page to update project list and remove accepted invitation
      window.location.reload();
      
      return result;
    } catch (error) {
      console.error("Accept invitation error:", error);
      
      notifications.show({
        title: "Error",
        message: "Failed to accept invitation. Please try again.",
        color: "red",
      });
      
      throw error;
    }
  }
}