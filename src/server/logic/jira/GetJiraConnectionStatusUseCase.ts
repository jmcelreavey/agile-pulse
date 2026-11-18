import { env } from "~/env";
import {
  AuthenticatedUseCase,
  type getReturnType,
} from "~/server/logic/useCase";

export interface GetJiraConnectionStatusUseCaseOutput {
  isConnected: boolean;
  connectionType: "oauth" | "manual" | null;
  fullName: string | null;
  cloudId: string | null;
  domain: string | null;
  hasOAuthAccount: boolean;
}

export class GetJiraConnectionStatusUseCase extends AuthenticatedUseCase {
  async execute(): Promise<GetJiraConnectionStatusUseCaseOutput> {
    // Check for OAuth Atlassian account first
    let oauthAccount = await this.db.account.findFirst({
      where: {
        userId: this.user.id,
        provider: "atlassian",
      },
      select: {
        access_token: true,
        refresh_token: true,
        expires_at: true,
        id: true,
      },
    });

    // Check if token is expired and needs refresh
    const isTokenExpired =
      oauthAccount?.expires_at &&
      oauthAccount.expires_at <= Math.floor(Date.now() / 1000);

    if (oauthAccount && isTokenExpired && oauthAccount.refresh_token) {
      try {
        const response = await fetch("https://auth.atlassian.com/oauth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            grant_type: "refresh_token",
            client_id: env.AUTH_JIRA_CLIENT_ID,
            client_secret: env.AUTH_JIRA_CLIENT_SECRET,
            refresh_token: oauthAccount.refresh_token,
          }),
        });

        if (response.ok) {
          const tokens = (await response.json()) as {
            access_token: string;
            expires_in: number;
            refresh_token?: string;
          };

          // Update the database with new tokens
          const updatedAccount = await this.db.account.update({
            where: { id: oauthAccount.id },
            data: {
              access_token: tokens.access_token,
              expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
              refresh_token: tokens.refresh_token || oauthAccount.refresh_token,
            },
            select: {
              access_token: true,
              refresh_token: true,
              expires_at: true,
              id: true,
            },
          });

          oauthAccount = updatedAccount;
        }
      } catch (error) {
        // Silently handle refresh errors - token will be marked as invalid
        console.error("Error refreshing Jira OAuth token:", error);
      }
    }

    // Check for manual Jira configuration
    const user = await this.db.user.findUnique({
      where: { id: this.user.id },
      select: {
        jiraAccountId: true,
        jiraCloudId: true,
        fullName: true,
        jiraAccessToken: true,
        domain: true,
      },
    });

    // Check if we have a valid OAuth account (token exists and not expired)
    const hasValidOAuthToken =
      Boolean(oauthAccount?.access_token) &&
      (!oauthAccount?.expires_at ||
        oauthAccount.expires_at > Math.floor(Date.now() / 1000));

    // Check if we have a complete Jira configuration (from either OAuth auto-config or manual setup)
    const hasCompleteJiraConfig = Boolean(
      user?.jiraAccountId && user?.jiraCloudId
    );

    // Determine connection status and type
    let isConnected = false;
    let connectionType: "oauth" | "manual" | null = null;

    if (hasCompleteJiraConfig) {
      isConnected = true;
      // Determine if this was configured via OAuth or manually
      // If they have OAuth token and it matches their stored token, it's OAuth
      if (
        hasValidOAuthToken &&
        user?.jiraAccessToken === oauthAccount!.access_token
      ) {
        connectionType = "oauth";
      } else {
        connectionType = "manual";
      }
    }

    return {
      isConnected,
      connectionType,
      fullName: user?.fullName ?? null,
      cloudId: user?.jiraCloudId ?? null,
      domain: user?.domain ?? null,
      hasOAuthAccount: hasValidOAuthToken,
    };
  }
}

export type GetJiraConnectionStatusUseCaseType =
  getReturnType<GetJiraConnectionStatusUseCase>;
