import type { PrismaClient } from "~/generated/prisma/client";

export interface TokenHealthReport {
  userId: number;
  userEmail: string | null;
  hasOAuthAccount: boolean;
  tokenExpiresAt: Date | null;
  tokenExpiresInMinutes: number | null;
  isExpired: boolean;
  isExpiringSoon: boolean; // Within 30 minutes
  hasRefreshToken: boolean;
  needsRelink: boolean;
}

export class JiraTokenMonitor {
  private static readonly EXPIRING_SOON_MINUTES = 30;

  constructor(private db: PrismaClient) {}

  async getTokenHealthReport(): Promise<TokenHealthReport[]> {
    const now = new Date();
    const nowUnix = Math.floor(now.getTime() / 1000);

    // Get all users with Jira accounts
    const users = await this.db.user.findMany({
      where: {
        jiraAccountId: { not: null },
      },
      select: {
        id: true,
        email: true,
        jiraAccountId: true,
        accounts: {
          where: {
            provider: "atlassian",
          },
          select: {
            access_token: true,
            refresh_token: true,
            expires_at: true,
          },
        },
      },
    });

    const reports: TokenHealthReport[] = users.map((user) => {
      const oauthAccount = user.accounts[0];
      const hasOAuthAccount = Boolean(oauthAccount?.access_token);

      let tokenExpiresAt: Date | null = null;
      let tokenExpiresInMinutes: number | null = null;
      let isExpired = false;
      let isExpiringSoon = false;

      if (oauthAccount?.expires_at) {
        tokenExpiresAt = new Date(oauthAccount.expires_at * 1000);
        tokenExpiresInMinutes = Math.round(
          (oauthAccount.expires_at - nowUnix) / 60
        );
        isExpired = oauthAccount.expires_at <= nowUnix;
        isExpiringSoon =
          !isExpired &&
          oauthAccount.expires_at <=
            nowUnix + JiraTokenMonitor.EXPIRING_SOON_MINUTES * 60;
      }

      const needsRelink =
        hasOAuthAccount && isExpired && !oauthAccount?.refresh_token;

      return {
        userId: user.id,
        userEmail: user.email,
        hasOAuthAccount,
        tokenExpiresAt,
        tokenExpiresInMinutes,
        isExpired,
        isExpiringSoon,
        hasRefreshToken: Boolean(oauthAccount?.refresh_token),
        needsRelink,
      };
    });

    return reports.sort((a, b) => {
      // Sort by urgency: needs relink > expired > expiring soon > normal
      if (a.needsRelink && !b.needsRelink) return -1;
      if (!a.needsRelink && b.needsRelink) return 1;
      if (a.isExpired && !b.isExpired) return -1;
      if (!a.isExpired && b.isExpired) return 1;
      if (a.isExpiringSoon && !b.isExpiringSoon) return -1;
      if (!a.isExpiringSoon && b.isExpiringSoon) return 1;
      return 0;
    });
  }

  async getTokenHealthSummary(): Promise<{
    totalUsers: number;
    usersNeedingRelink: number;
    usersWithExpiredTokens: number;
    usersWithExpiringSoonTokens: number;
    usersWithHealthyTokens: number;
    usersWithoutOAuth: number;
  }> {
    const reports = await this.getTokenHealthReport();

    return {
      totalUsers: reports.length,
      usersNeedingRelink: reports.filter((r) => r.needsRelink).length,
      usersWithExpiredTokens: reports.filter((r) => r.isExpired).length,
      usersWithExpiringSoonTokens: reports.filter((r) => r.isExpiringSoon)
        .length,
      usersWithHealthyTokens: reports.filter(
        (r) => r.hasOAuthAccount && !r.isExpired && !r.isExpiringSoon
      ).length,
      usersWithoutOAuth: reports.filter((r) => !r.hasOAuthAccount).length,
    };
  }

  async logTokenHealthSummary(): Promise<void> {
    const summary = await this.getTokenHealthSummary();

    console.log("\n📊 Jira Token Health Summary:");
    console.log(`   Total Users: ${summary.totalUsers}`);
    console.log(`   🔴 Need Relink: ${summary.usersNeedingRelink}`);
    console.log(`   🟡 Expired: ${summary.usersWithExpiredTokens}`);
    console.log(`   🟠 Expiring Soon: ${summary.usersWithExpiringSoonTokens}`);
    console.log(`   🟢 Healthy: ${summary.usersWithHealthyTokens}`);
    console.log(`   ⚪ No OAuth: ${summary.usersWithoutOAuth}`);

    if (summary.usersNeedingRelink > 0 || summary.usersWithExpiredTokens > 0) {
      const urgentReports = (await this.getTokenHealthReport()).filter(
        (r) => r.needsRelink || r.isExpired
      );

      console.log("\n⚠️  Users requiring attention:");
      urgentReports.forEach((report) => {
        const status = report.needsRelink
          ? "NEEDS RELINK"
          : report.isExpired
          ? "EXPIRED"
          : "EXPIRING SOON";
        console.log(
          `   - ${report.userEmail} (ID: ${report.userId}): ${status}`
        );
      });
    }
  }
}
