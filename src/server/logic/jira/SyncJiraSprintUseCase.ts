import type { SyncJiraSprintInput } from "~/server/api/schemas/jira";
import { InternalServerError } from "~/server/errors/InternalServerError";
import { NotAuthorisedError } from "~/server/errors/NotAuthorisedError";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import {
  AuthenticatedUseCase,
  type getReturnType,
} from "~/server/logic/useCase";
import { extractUniqueJiraUsers } from "~/shared/logic/jira/JiraToTaskMapperUtil";
import { JiraApiClient, JiraApiError, type JiraIssue } from "~/server/logic/jira/JiraApiClient";
import { JiraTokenManager } from "~/server/logic/jira/JiraTokenManager";
import { SyncSprintUseCase } from "~/server/logic/jira/SyncSprintUseCase";
import { UserMappingUseCase } from "~/server/logic/jira/UserMappingUseCase";

interface SyncJiraSprintUseCaseOutput {
  success: boolean;
  tasksCreated: number;
  tasksUpdated: number;
  tasksSkipped: number;
  usersNotFound: string[];
  syncedAt: Date;
  warnings: string[];
}

export class SyncJiraSprintUseCase extends AuthenticatedUseCase {
  async execute(
    input: SyncJiraSprintInput
  ): Promise<SyncJiraSprintUseCaseOutput> {
    const warnings: string[] = [];

    const tokenManager = new JiraTokenManager(this.db, this.user.id);

    try {
      const { accessToken, cloudId } = await tokenManager.getValidAccessToken();

      // Verify user owns/has access to the sprint
      const sprint = await this.db.sprint.findFirst({
        where: { id: input.sprintId },
        include: {
          project: true,
          sprintTasks: { select: { id: true } },
        },
      });

      if (!sprint) {
        throw new RecordNotFoundError("Sprint not found or access denied");
      }

      // Check if project is linked to Jira
      if (!sprint.project.jiraProjectKey) {
        throw new InternalServerError(
          "Project must be linked to a Jira project before syncing sprints"
        );
      }

      // Use the cloudId from the token manager if input.cloudId matches, otherwise use input.cloudId
      // This ensures compatibility while preferring the stored cloudId
      const effectiveCloudId =
        input.cloudId === cloudId ? cloudId : input.cloudId;

      const client = new JiraApiClient(effectiveCloudId, accessToken);

      // Validate Jira sprint exists
      const jiraSprintId = parseInt(input.jiraSprintId);
      if (isNaN(jiraSprintId)) {
        throw new InternalServerError("Invalid Jira sprint ID format");
      }

      // Fetch issues from Jira
      let jiraIssues: JiraIssue[];
      try {
        jiraIssues = await client.getIssues(jiraSprintId);
      } catch (fetchError) {
        const apiError = fetchError as Error;
        if (apiError.message.includes("404")) {
          throw new RecordNotFoundError(
            "Jira sprint not found or access denied"
          );
        }
        throw new InternalServerError(
          "Failed to fetch issues from Jira",
          fetchError
        );
      }

      if (jiraIssues.length === 0) {
        warnings.push("No issues found in the Jira sprint");
      }

      // Check for existing tasks if not overriding
      const existingTaskCount = sprint.sprintTasks.length;
      if (existingTaskCount > 0 && !input.overrideExisting) {
        warnings.push(
          `Sprint has ${existingTaskCount} existing tasks that will be skipped`
        );
      }

      // Map users based on email addresses
      const userMappingUseCase = new UserMappingUseCase(this.db);
      const jiraUsersList = extractUniqueJiraUsers(jiraIssues);

      const userMappingResult = await userMappingUseCase.execute({
        jiraUsers: jiraUsersList,
        sprintId: input.sprintId,
        domain: this.user.domain,
      });

      const unmappedUsers = userMappingResult.unmappedJiraUsers.map(
        (u) => u.displayName
      );
      if (unmappedUsers.length > 0) {
        warnings.push(
          `${
            unmappedUsers.length
          } Jira users could not be mapped to team members: ${unmappedUsers.join(
            ", "
          )}`
        );
      }

      // Sync sprint using our core business logic
      const syncSprintUseCase = new SyncSprintUseCase(this.db);
      const syncResult = await syncSprintUseCase.execute({
        sprintId: input.sprintId,
        jiraIssues: jiraIssues,
        overrideExisting: input.overrideExisting,
      });

      // Update sprint with Jira sync info
      const syncedAt = new Date();
      await this.db.sprint.update({
        where: { id: input.sprintId },
        data: {
          jiraSprintId: input.jiraSprintId,
          lastSyncedAt: syncedAt,
        },
      });

      return {
        success: true,
        tasksCreated: syncResult.tasksCreated,
        tasksUpdated: syncResult.tasksUpdated,
        tasksSkipped: syncResult.tasksSkipped,
        usersNotFound: unmappedUsers,
        syncedAt,
        warnings,
      };
    } catch (handleError) {
      // Enhanced error handling with more specific messages
      if (
        handleError instanceof NotAuthorisedError ||
        handleError instanceof RecordNotFoundError ||
        handleError instanceof InternalServerError
      ) {
        throw handleError; // Re-throw our custom errors as-is
      }

      // Handle JiraApiError specifically
      if (handleError instanceof JiraApiError) {
        if (handleError.shouldRelink) {
          throw new NotAuthorisedError(handleError.message);
        }
        throw new InternalServerError(handleError.message);
      }

      // Handle network connectivity errors
      if (handleError instanceof Error) {
        const errorMessage = handleError.message.toLowerCase();

        // Authentication and authorization errors
        if (
          errorMessage.includes("401") ||
          errorMessage.includes("unauthorized")
        ) {
          throw new NotAuthorisedError(
            "Jira authentication failed. Your session may have expired. Please re-link your Jira account."
          );
        }

        if (
          errorMessage.includes("403") ||
          errorMessage.includes("forbidden")
        ) {
          throw new NotAuthorisedError(
            "Access denied to this Jira sprint or project. Please check your Jira permissions or contact your administrator."
          );
        }

        // Resource not found errors
        if (errorMessage.includes("404")) {
          throw new RecordNotFoundError(
            "Jira sprint or project not found. The sprint may have been deleted or moved. Please verify the sprint ID and project access."
          );
        }

        // Rate limiting errors
        if (
          errorMessage.includes("rate limit") ||
          errorMessage.includes("429") ||
          errorMessage.includes("too many requests")
        ) {
          throw new InternalServerError(
            "Jira API rate limit exceeded. Please wait a few minutes before trying again."
          );
        }

        // Network and connectivity errors
        if (
          errorMessage.includes("network") ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("enotfound") ||
          errorMessage.includes("connection")
        ) {
          throw new InternalServerError(
            "Unable to connect to Jira. Please check your internet connection and try again."
          );
        }

        // Server errors
        if (
          errorMessage.includes("500") ||
          errorMessage.includes("502") ||
          errorMessage.includes("503") ||
          errorMessage.includes("504")
        ) {
          throw new InternalServerError(
            "Jira service is temporarily unavailable. Please try again in a few minutes."
          );
        }

        // Data validation errors
        if (
          errorMessage.includes("validation") ||
          errorMessage.includes("invalid")
        ) {
          throw new InternalServerError(
            "Invalid data format encountered during sync. Please check your Jira configuration."
          );
        }

        // Permission or configuration errors
        if (
          errorMessage.includes("permission") ||
          errorMessage.includes("access")
        ) {
          throw new NotAuthorisedError(
            "Insufficient permissions to access this Jira resource. Please contact your Jira administrator."
          );
        }
      }

      // Log the original error for debugging
      console.error("Unexpected Jira sync error:", handleError);

      throw new InternalServerError(
        "An unexpected error occurred during Jira sync. Please try again or contact support if the problem persists.",
        handleError
      );
    }
  }
}

export type SyncJiraSprintUseCaseType = getReturnType<SyncJiraSprintUseCase>;
export type SyncJiraSprintUseCaseInput = Parameters<
  SyncJiraSprintUseCase["execute"]
>[0];
