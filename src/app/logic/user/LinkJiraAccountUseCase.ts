import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { UseCase } from "~/app/logic/useCase";
import { type LinkJiraAccountInput } from "~/server/api/schemas/jira";
import { api } from "~/trpc/react";

export class LinkJiraAccountUseCase extends UseCase {
  public mutation = api.jira.linkAccount.useMutation();

  public async execute({
    input,
    isUpdate = false,
  }: {
    input: LinkJiraAccountInput;
    isUpdate?: boolean;
  }) {
    try {
      this.setIsMutating(true);
      await this.mutation.mutateAsync(input);

      // Invalidate connection status to refresh the UI
      await this.useUtils.jira.getConnectionStatus.invalidate();

      ShowNotificationUtil({
        title: `Jira account ${isUpdate ? "updated" : "linked"}!`,
        message: `Successfully ${
          isUpdate ? "updated" : "linked"
        } your Jira account. You can now link projects and sync sprints.`,
      });
    } catch (error) {
      // Enhanced error handling with helpful guidance
      let errorMessage = "An unexpected error occurred";
      let errorTitle = `Error ${
        isUpdate ? "updating" : "linking"
      } Jira account`;

      if (error instanceof Error) {
        errorMessage = error.message;

        // Provide specific guidance based on error type
        if (error.message.includes("401") || error.message.includes("403")) {
          errorTitle = "Invalid Credentials";
          errorMessage =
            "Invalid Jira account ID or access token. Please check your credentials and try again.";
        } else if (error.message.includes("404")) {
          errorTitle = "Account Not Found";
          errorMessage =
            "Jira account not found. Please verify your account ID is correct.";
        } else if (error.message.includes("token")) {
          errorTitle = "Token Error";
          errorMessage =
            "Invalid or expired access token. Please generate a new API token from your Atlassian account.";
        } else if (
          error.message.includes("network") ||
          error.message.includes("connection")
        ) {
          errorTitle = "Connection Error";
          errorMessage =
            "Unable to connect to Jira. Please check your internet connection and try again.";
        } else if (error.message.includes("rate limit")) {
          errorTitle = "Rate Limit Exceeded";
          errorMessage =
            "Too many requests. Please wait a few minutes before trying again.";
        }
      }

      console.error("Jira account linking error:", error);
      ShowNotificationUtil({
        title: errorTitle,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
