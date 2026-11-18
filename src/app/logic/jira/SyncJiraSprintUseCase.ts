import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { UseCase } from "~/app/logic/useCase";
import { type SyncJiraSprintInput } from "~/server/api/schemas/jira";
import { api } from "~/trpc/react";

export class SyncJiraSprintUseCase extends UseCase {
  public mutation = api.jira.syncSprint.useMutation();

  public async execute({
    input,
    sprintReference,
  }: {
    input: SyncJiraSprintInput;
    sprintReference: string;
  }) {
    try {
      this.setIsMutating(true);
      const result = await this.mutation.mutateAsync(input);

      // Invalidate relevant queries to refresh the UI
      await Promise.all([
        this.useUtils.sprint.getTasks.invalidate(),
        this.useUtils.sprint.getOne.invalidate(),
        this.useUtils.sprint.getMembers.invalidate(),
      ]);

      const {
        tasksCreated,
        tasksUpdated,
        tasksSkipped,
        usersNotFound,
        warnings,
      } = result;
      const totalProcessed = tasksCreated + tasksUpdated;

      // Create comprehensive success message with enhanced feedback
      let primaryMessage = "";
      let detailMessage = "";

      if (totalProcessed === 0) {
        primaryMessage = "Sync completed - no tasks to process";
        detailMessage = "The sprint is up to date with Jira";
      } else {
        primaryMessage = `✅ ${totalProcessed} task${
          totalProcessed !== 1 ? "s" : ""
        } processed successfully`;
        const details = [];
        if (tasksCreated > 0) details.push(`${tasksCreated} created`);
        if (tasksUpdated > 0) details.push(`${tasksUpdated} updated`);
        if (tasksSkipped > 0) details.push(`${tasksSkipped} skipped`);
        detailMessage = details.join(", ");
      }

      // Add user mapping status to detail message
      if (usersNotFound.length > 0) {
        detailMessage +=
          usersNotFound.length > 0
            ? ` • ${usersNotFound.length} Jira user${
                usersNotFound.length !== 1 ? "s" : ""
              } could not be mapped`
            : "";
      }

      ShowNotificationUtil({
        title: `🎯 Sprint ${sprintReference} synced successfully!`,
        message: `${primaryMessage}${
          detailMessage ? ` (${detailMessage})` : ""
        }`,
        autoClose: 5000,
      });

      // Provide detailed feedback for unmapped users
      if (usersNotFound.length > 0) {
        setTimeout(() => {
          ShowNotificationUtil({
            title: "👥 User Mapping Info",
            message: `Some Jira users were not mapped to team members: ${usersNotFound.join(
              ", "
            )}. Tasks from these users were created as unassigned.`,
            isError: false,
            color: "blue",
            autoClose: 7000,
          });
        }, 1500);
      }

      // Show warnings as separate notifications if any
      if (warnings.length > 0) {
        warnings.forEach((warning, index) => {
          setTimeout(() => {
            ShowNotificationUtil({
              title: "⚠️ Sync Information",
              message: warning,
              isError: false,
              color: "orange",
              autoClose: 6000,
            });
          }, 2000 + 1000 * index); // Stagger warning notifications after user mapping info
        });
      }

      // Show helpful next steps
      if (totalProcessed > 0) {
        setTimeout(() => {
          ShowNotificationUtil({
            title: "🎉 What's Next?",
            message:
              "Review the synced tasks, assign team members, and start your sprint planning!",
            isError: false,
            color: "green",
            autoClose: 8000,
          });
        }, 3000 + warnings.length * 1000);
      }
    } catch (error) {
      // Enhanced error handling with comprehensive user feedback
      let errorMessage = "An unexpected error occurred during sync";
      let errorTitle = `Error syncing sprint ${sprintReference}`;
      let actionableMessage = "";

      if (error instanceof Error) {
        const errorText = error.message.toLowerCase();
        errorMessage = error.message;

        // Categorize errors and provide actionable feedback
        if (
          errorText.includes("not linked") ||
          errorText.includes("link your jira account")
        ) {
          errorTitle = "🔗 Jira Account Required";
          actionableMessage =
            "Please link your Jira account in your profile settings first.";
        } else if (
          errorText.includes("not found") ||
          errorText.includes("deleted or moved")
        ) {
          errorTitle = "❌ Sprint or Project Not Found";
          actionableMessage =
            "Please verify the sprint exists in Jira and you have access to it.";
        } else if (
          errorText.includes("access denied") ||
          errorText.includes("permissions") ||
          errorText.includes("forbidden") ||
          errorText.includes("insufficient permissions")
        ) {
          errorTitle = "🚫 Access Denied";
          actionableMessage =
            "Please check your Jira permissions or contact your administrator.";
        } else if (
          errorText.includes("rate limit") ||
          errorText.includes("too many requests")
        ) {
          errorTitle = "⏳ Rate Limit Exceeded";
          actionableMessage = "Please wait a few minutes before trying again.";
        } else if (
          errorText.includes("authentication failed") ||
          errorText.includes("session may have expired") ||
          errorText.includes("unauthorized")
        ) {
          errorTitle = "🔐 Authentication Required";
          actionableMessage =
            "Your Jira session has expired. Please re-link your account.";
        } else if (
          errorText.includes("network") ||
          errorText.includes("connection") ||
          errorText.includes("timeout")
        ) {
          errorTitle = "🌐 Connection Error";
          actionableMessage =
            "Please check your internet connection and try again.";
        } else if (
          errorText.includes("service is temporarily unavailable") ||
          errorText.includes("server error") ||
          errorText.includes("500") ||
          errorText.includes("502") ||
          errorText.includes("503")
        ) {
          errorTitle = "⚠️ Service Unavailable";
          actionableMessage =
            "Jira service is temporarily down. Please try again in a few minutes.";
        } else if (
          errorText.includes("invalid data format") ||
          errorText.includes("validation")
        ) {
          errorTitle = "📋 Data Format Error";
          actionableMessage =
            "Please check your Jira configuration and try again.";
        } else if (errorText.includes("project must be linked")) {
          errorTitle = "🔗 Project Linking Required";
          actionableMessage =
            "Please link this project to a Jira project first.";
        }
      }

      // Log detailed error for debugging
      console.error("Jira sync error details:", {
        error,
        sprintReference,
        errorTitle,
        errorMessage,
        actionableMessage,
      });

      // Show primary error notification
      ShowNotificationUtil({
        title: errorTitle,
        message: errorMessage,
        isError: true,
        autoClose: 8000,
      });

      // Show actionable guidance as a follow-up notification
      if (actionableMessage) {
        setTimeout(() => {
          ShowNotificationUtil({
            title: "💡 How to fix this:",
            message: actionableMessage,
            isError: false,
            color: "blue",
            autoClose: 10000,
          });
        }, 2000);
      }
    } finally {
      this.setIsMutating(false);
    }
  }
}
