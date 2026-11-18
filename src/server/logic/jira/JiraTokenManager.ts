import type { PrismaClient } from "~/generated/prisma/client";
import { env } from "~/env";
import { NotAuthorisedError } from "~/server/errors/NotAuthorisedError";

export class JiraTokenRefreshError extends Error {
  constructor(message: string, public shouldRelink = false) {
    super(message);
    this.name = "JiraTokenRefreshError";
  }
}

export class JiraTokenManager {
  private static readonly TOKEN_REFRESH_BUFFER_MINUTES = 10; // Refresh 10 minutes before expiry
  private static readonly RETRY_ATTEMPTS = 2;
  private static readonly RETRY_DELAY_MS = 1000;

  constructor(private db: PrismaClient, private userId: number) {}

  async getValidAccessToken(): Promise<{
    accessToken: string;
    cloudId: string;
  }> {
    console.log(
      `🔍 [JiraTokenManager] Getting valid access token for user ${this.userId}`
    );

    // Check for OAuth Atlassian account first
    let oauthAccount = await this.db.account.findFirst({
      where: {
        userId: this.userId,
        provider: "atlassian",
      },
      select: {
        access_token: true,
        refresh_token: true,
        expires_at: true,
        id: true,
      },
    });

    // Check if token needs refresh (either expired or about to expire)
    const now = Math.floor(Date.now() / 1000);
    const isTokenExpiredOrExpiring = oauthAccount?.expires_at
      ? oauthAccount.expires_at <=
        now + JiraTokenManager.TOKEN_REFRESH_BUFFER_MINUTES * 60
      : false;

    if (
      oauthAccount &&
      isTokenExpiredOrExpiring &&
      oauthAccount.refresh_token
    ) {
      console.log(
        `🔄 [JiraTokenManager] Token expired/expiring, attempting refresh for user ${this.userId}`
      );

      try {
        oauthAccount = await this.refreshTokenWithRetry(oauthAccount);
        console.log(
          `✅ [JiraTokenManager] Token refreshed successfully for user ${this.userId}`
        );
      } catch (error) {
        console.error(
          `❌ [JiraTokenManager] Token refresh failed for user ${this.userId}:`,
          error
        );

        // If refresh fails, we'll try to use the stored token as fallback
        // but we should warn that the user may need to re-link
        if (error instanceof JiraTokenRefreshError && error.shouldRelink) {
          throw new NotAuthorisedError(
            "Your Jira authentication has expired and could not be refreshed automatically. " +
              "Please re-link your Jira account in the settings to continue using Jira features."
          );
        }
      }
    }

    // Get user's Jira configuration
    const user = await this.db.user.findUnique({
      where: { id: this.userId },
      select: {
        jiraAccessToken: true,
        jiraCloudId: true,
        jiraAccountId: true,
      },
    });

    if (!user?.jiraAccountId) {
      throw new NotAuthorisedError(
        "Your Jira account is not linked. Please connect your Jira account in the settings to access Jira features."
      );
    }

    if (!user?.jiraCloudId) {
      throw new NotAuthorisedError(
        "Your Jira Cloud ID is not configured. Please re-link your Jira account in the settings."
      );
    }

    // Check if we have a valid OAuth token (not expired)
    const hasValidOAuth =
      oauthAccount?.access_token &&
      (!oauthAccount.expires_at || oauthAccount.expires_at > now);

    // Prefer OAuth token over stored token
    const accessToken =
      hasValidOAuth && oauthAccount
        ? oauthAccount.access_token!
        : user.jiraAccessToken;

    if (!accessToken) {
      throw new NotAuthorisedError(
        "No valid Jira access token found. Your authentication may have expired. " +
          "Please re-link your Jira account in the settings to continue using Jira features."
      );
    }

    console.log(
      `✅ [JiraTokenManager] Valid access token obtained for user ${
        this.userId
      } (OAuth: ${!!hasValidOAuth})`
    );

    return {
      accessToken,
      cloudId: user.jiraCloudId,
    };
  }

  private async refreshTokenWithRetry(oauthAccount: {
    access_token: string | null;
    refresh_token: string | null;
    expires_at: number | null;
    id: number;
  }): Promise<{
    access_token: string | null;
    refresh_token: string | null;
    expires_at: number | null;
    id: number;
  }> {
    let lastError: Error | null = null;

    for (
      let attempt = 1;
      attempt <= JiraTokenManager.RETRY_ATTEMPTS;
      attempt++
    ) {
      try {
        console.log(
          `🔄 [JiraTokenManager] Token refresh attempt ${attempt}/${JiraTokenManager.RETRY_ATTEMPTS}`
        );

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

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `❌ [JiraTokenManager] Refresh failed with status ${response.status}:`,
            errorText
          );

          // Check for specific error conditions that indicate user needs to re-link
          if (response.status === 400 || response.status === 401) {
            const shouldRelink =
              errorText.includes("invalid_grant") ||
              errorText.includes("refresh_token") ||
              response.status === 401;

            throw new JiraTokenRefreshError(
              `Token refresh failed: ${response.status} ${response.statusText} - ${errorText}`,
              shouldRelink
            );
          }

          throw new JiraTokenRefreshError(
            `Token refresh failed: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

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

        // Also update the user's stored token to keep it in sync
        await this.db.user.update({
          where: { id: this.userId },
          data: {
            jiraAccessToken: tokens.access_token,
          },
        });

        console.log(
          `✅ [JiraTokenManager] Token refreshed successfully, expires in ${tokens.expires_in} seconds`
        );
        return updatedAccount;
      } catch (error) {
        lastError = error as Error;

        // If it's a JiraTokenRefreshError, don't retry
        if (error instanceof JiraTokenRefreshError) {
          throw error;
        }

        // For other errors, wait before retrying (except on last attempt)
        if (attempt < JiraTokenManager.RETRY_ATTEMPTS) {
          console.log(
            `⏳ [JiraTokenManager] Waiting ${JiraTokenManager.RETRY_DELAY_MS}ms before retry...`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, JiraTokenManager.RETRY_DELAY_MS)
          );
        }
      }
    }

    // If we get here, all attempts failed
    throw new JiraTokenRefreshError(
      `Token refresh failed after ${JiraTokenManager.RETRY_ATTEMPTS} attempts: ${lastError?.message}`,
      true // User should re-link after multiple failures
    );
  }
}
