import type { GetJiraSprintIssuesInput } from "~/server/api/schemas/jira";
import { InternalServerError } from "~/server/errors/InternalServerError";
import { NotAuthorisedError } from "~/server/errors/NotAuthorisedError";
import {
  AuthenticatedUseCase,
  type getReturnType,
} from "~/server/logic/useCase";
import { JiraApiClient, JiraApiError } from "~/server/logic/jira/JiraApiClient";
import { JiraTokenManager } from "~/server/logic/jira/JiraTokenManager";

export class GetJiraSprintIssuesUseCase extends AuthenticatedUseCase {
  async execute(input: GetJiraSprintIssuesInput) {
    const tokenManager = new JiraTokenManager(this.db, this.user.id);

    try {
      const { accessToken, cloudId } = await tokenManager.getValidAccessToken();

      // Use the cloudId from the token manager if input.cloudId matches, otherwise use input.cloudId
      // This ensures compatibility while preferring the stored cloudId
      const effectiveCloudId =
        input.cloudId === cloudId ? cloudId : input.cloudId;

      const client = new JiraApiClient(effectiveCloudId, accessToken);
      const issues = await client.getIssues(input.sprintId);
      return issues;
    } catch (error) {
      if (error instanceof NotAuthorisedError) {
        // Re-throw auth errors from token manager as-is (they have good messages)
        throw error;
      }

      if (error instanceof JiraApiError) {
        if (error.shouldRelink) {
          throw new NotAuthorisedError(error.message);
        }
        throw new InternalServerError(error.message);
      }

      throw new InternalServerError("Failed to fetch Jira issues", error);
    }
  }
}

export type GetJiraSprintIssuesUseCaseType =
  getReturnType<GetJiraSprintIssuesUseCase>;
export type GetJiraSprintIssuesUseCaseInput = Parameters<
  GetJiraSprintIssuesUseCase["execute"]
>[0];
