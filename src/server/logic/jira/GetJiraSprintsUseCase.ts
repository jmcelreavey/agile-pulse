import type { GetJiraSprintsInput } from "~/server/api/schemas/jira";
import { InternalServerError } from "~/server/errors/InternalServerError";
import { NotAuthorisedError } from "~/server/errors/NotAuthorisedError";
import {
  AuthenticatedUseCase,
  type getReturnType,
} from "~/server/logic/useCase";
import { JiraApiClient, JiraApiError } from "~/server/logic/jira/JiraApiClient";
import { JiraTokenManager } from "~/server/logic/jira/JiraTokenManager";

export class GetJiraSprintsUseCase extends AuthenticatedUseCase {
  async execute(input: GetJiraSprintsInput) {
    const tokenManager = new JiraTokenManager(this.db, this.user.id);

    try {
      const { accessToken, cloudId } = await tokenManager.getValidAccessToken();

      // Use the cloudId from the token manager if input.cloudId matches, otherwise use input.cloudId
      // This ensures compatibility while preferring the stored cloudId
      const effectiveCloudId =
        input.cloudId === cloudId ? cloudId : input.cloudId;

      const client = new JiraApiClient(effectiveCloudId, accessToken);
      const sprints = await client.getSprints(input.projectKey);
      return sprints;
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

      throw new InternalServerError("Failed to fetch Jira sprints", error);
    }
  }
}

export type GetJiraSprintsUseCaseType = getReturnType<GetJiraSprintsUseCase>;
export type GetJiraSprintsUseCaseInput = Parameters<
  GetJiraSprintsUseCase["execute"]
>[0];
