import { InternalServerError } from "~/server/errors/InternalServerError";
import { NotAuthorisedError } from "~/server/errors/NotAuthorisedError";
import {
  AuthenticatedUseCase,
  type getReturnType,
} from "~/server/logic/useCase";
import { JiraApiClient, JiraApiError } from "~/server/logic/jira/JiraApiClient";
import { JiraTokenManager } from "~/server/logic/jira/JiraTokenManager";

interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
}

export class GetJiraProjectsUseCase extends AuthenticatedUseCase {
  async execute(): Promise<JiraProject[]> {
    const tokenManager = new JiraTokenManager(this.db, this.user.id);

    try {
      const { accessToken, cloudId } = await tokenManager.getValidAccessToken();
      const client = new JiraApiClient(cloudId, accessToken);
      const projects = await client.getProjects();
      return projects;
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

      throw new InternalServerError(
        "Failed to fetch Jira projects",
        error
      );
    }
  }
}

export type GetJiraProjectsUseCaseType = getReturnType<GetJiraProjectsUseCase>;
