import { InternalServerError } from "~/server/errors/InternalServerError";
import { NotAuthorisedError } from "~/server/errors/NotAuthorisedError";
import { AuthenticatedUseCase } from "~/server/logic/useCase";
import { JiraApiClient } from "~/server/logic/jira/JiraApiClient";

export interface AutoConfigureJiraFromOAuthOutput {
  success: boolean;
  wasAlreadyConfigured: boolean;
  accountId?: string;
  cloudId?: string;
  fullName?: string;
}

export class AutoConfigureJiraFromOAuthUseCase extends AuthenticatedUseCase {
  async execute(): Promise<AutoConfigureJiraFromOAuthOutput> {
    // Check if user has OAuth Atlassian account
    const oauthAccount = await this.db.account.findFirst({
      where: {
        userId: this.user.id,
        provider: "atlassian",
      },
      select: {
        access_token: true,
        refresh_token: true,
        expires_at: true,
        providerAccountId: true,
      },
    });

    if (!oauthAccount?.access_token) {
      throw new NotAuthorisedError("No Atlassian OAuth account found");
    }

    // Check if token is still valid
    const isTokenValid =
      !oauthAccount.expires_at ||
      oauthAccount.expires_at > Math.floor(Date.now() / 1000);

    if (!isTokenValid) {
      throw new NotAuthorisedError("Atlassian OAuth token has expired");
    }

    // Check if user is already configured
    const existingUser = await this.db.user.findUnique({
      where: { id: this.user.id },
      select: {
        jiraAccountId: true,
        jiraAccessToken: true,
        jiraCloudId: true,
        fullName: true,
      },
    });

    const isAlreadyConfigured = Boolean(
      existingUser?.jiraAccountId && existingUser?.jiraAccessToken
    );

    try {
      // We need to get cloud ID from Atlassian's accessible resources API
      const resourcesResponse = await fetch(
        "https://api.atlassian.com/oauth/token/accessible-resources",
        {
          headers: {
            Authorization: `Bearer ${oauthAccount.access_token}`,
            Accept: "application/json",
          },
        }
      );

      if (!resourcesResponse.ok) {
        throw new InternalServerError("Failed to fetch accessible resources");
      }

      const resources = (await resourcesResponse.json()) as Array<{
        id: string;
        name: string;
        url: string;
        scopes: string[];
        avatarUrl: string;
      }>;

      // Find the first Jira cloud resource
      const jiraResource = resources.find(
        (resource) =>
          resource.scopes.includes("read:jira-work") ||
          resource.scopes.includes("write:jira-work")
      );

      if (!jiraResource) {
        throw new InternalServerError(
          "No Jira resources found in OAuth account"
        );
      }

      // Get user info from Jira
      const jiraClient = new JiraApiClient(
        jiraResource.id,
        oauthAccount.access_token
      );
      const currentUser = await jiraClient.getCurrentUser();

      // Update user with OAuth-derived information
      await this.db.user.update({
        where: { id: this.user.id },
        data: {
          jiraAccountId: currentUser.accountId,
          jiraAccessToken: oauthAccount.access_token,
          jiraCloudId: jiraResource.id,
          fullName: currentUser.displayName,
        },
      });

      return {
        success: true,
        wasAlreadyConfigured: isAlreadyConfigured,
        accountId: currentUser.accountId,
        cloudId: jiraResource.id,
        fullName: currentUser.displayName,
      };
    } catch (error) {
      throw new InternalServerError(
        "Failed to auto-configure Jira from OAuth",
        error
      );
    }
  }
}
