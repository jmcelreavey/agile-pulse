import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class JiraConnectionUseCase extends UseCase {
  public autoConfigureMutation = api.jira.autoConfigureFromOAuth.useMutation();
  public unlinkMutation = api.jira.unlinkAccount.useMutation();

  public async autoConfigureFromOAuth() {
    try {
      this.setIsMutating(true);
      const result = await this.autoConfigureMutation.mutateAsync();

      await this.useUtils.jira.getConnectionStatus.invalidate();

      ShowNotificationUtil({
        title: result.wasAlreadyConfigured ? "Jira Updated" : "Jira Connected",
        message: `Successfully ${
          result.wasAlreadyConfigured ? "updated" : "connected"
        } ${result.fullName}'s Jira account`,
        color: "green",
      });

      return result;
    } catch (error) {
      this.setIsMutating(false);

      let errorMessage =
        "Unable to configure Jira. Please try signing in again.";
      let errorTitle = "Configuration Failed";

      if (error instanceof Error) {
        if (error.message.includes("OAuth")) {
          errorTitle = "OAuth Error";
          errorMessage =
            "OAuth authentication failed. Please try signing in again.";
        } else if (error.message.includes("token")) {
          errorTitle = "Token Error";
          errorMessage =
            "Authentication token is invalid or expired. Please sign in again.";
        } else if (error.message.includes("resources")) {
          errorTitle = "No Jira Access";
          errorMessage =
            "No Jira resources found. Please ensure you have access to Jira.";
        }
      }

      console.error("Auto configure failed:", error);
      ShowNotificationUtil({
        title: errorTitle,
        message: errorMessage,
        color: "red",
      });

      throw error;
    } finally {
      this.setIsMutating(false);
    }
  }

  public async unlinkAccount() {
    try {
      this.setIsMutating(true);
      await this.unlinkMutation.mutateAsync();

      await this.useUtils.jira.getConnectionStatus.invalidate();

      ShowNotificationUtil({
        title: "Jira Disconnected",
        message: "Your Jira account has been unlinked",
        color: "blue",
      });
    } catch (error) {
      this.setIsMutating(false);

      let errorMessage = "Unable to disconnect Jira account. Please try again.";
      let errorTitle = "Disconnect Failed";

      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          errorTitle = "Account Not Found";
          errorMessage = "No Jira account found to disconnect.";
        } else if (error.message.includes("permission")) {
          errorTitle = "Permission Error";
          errorMessage =
            "You don't have permission to disconnect this account.";
        }
      }

      console.error("Unlink failed:", error);
      ShowNotificationUtil({
        title: errorTitle,
        message: errorMessage,
        color: "red",
      });

      throw error;
    } finally {
      this.setIsMutating(false);
    }
  }
}
