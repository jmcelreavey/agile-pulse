import type { LinkJiraAccountInput } from "~/server/api/schemas/jira";
import {
  AuthenticatedUseCase,
  type getReturnType,
} from "~/server/logic/useCase";

export class LinkJiraAccountUseCase extends AuthenticatedUseCase {
  async execute(input: LinkJiraAccountInput): Promise<{ success: boolean }> {
    await this.db.user.update({
      where: { id: this.user.id },
      data: {
        jiraAccountId: input.jiraAccountId,
        jiraAccessToken: input.jiraAccessToken,
        jiraCloudId: input.jiraCloudId,
        fullName: input.fullName,
      },
    });

    return { success: true };
  }
}

export type LinkJiraAccountUseCaseType = getReturnType<LinkJiraAccountUseCase>;
export type LinkJiraAccountUseCaseInput = Parameters<
  LinkJiraAccountUseCase["execute"]
>[0];
