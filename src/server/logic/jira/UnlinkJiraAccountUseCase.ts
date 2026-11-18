import {
  AuthenticatedUseCase,
  type getReturnType,
} from "~/server/logic/useCase";

interface UnlinkJiraAccountOutput {
  success: boolean;
}

export class UnlinkJiraAccountUseCase extends AuthenticatedUseCase {
  async execute(): Promise<UnlinkJiraAccountOutput> {
    await this.db.user.update({
      where: { id: this.user.id },
      data: {
        jiraAccountId: null,
        jiraAccessToken: null,
        jiraCloudId: null,
        fullName: null,
      },
    });

    return { success: true };
  }
}

export type UnlinkJiraAccountUseCaseType =
  getReturnType<UnlinkJiraAccountUseCase>;
export type UnlinkJiraAccountUseCaseInput = void;
