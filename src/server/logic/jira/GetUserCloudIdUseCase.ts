import { NotAuthorisedError } from "~/server/errors/NotAuthorisedError";
import {
  AuthenticatedUseCase,
  type getReturnType,
} from "~/server/logic/useCase";

interface GetUserCloudIdUseCaseOutput {
  cloudId: string;
}

export class GetUserCloudIdUseCase extends AuthenticatedUseCase {
  async execute(): Promise<GetUserCloudIdUseCaseOutput> {
    const user = await this.db.user.findUnique({
      where: { id: this.user.id },
      select: {
        jiraCloudId: true,
        jiraAccountId: true,
      },
    });

    if (!user?.jiraAccountId) {
      throw new NotAuthorisedError("Jira account not linked");
    }

    if (!user?.jiraCloudId) {
      throw new NotAuthorisedError("Jira Cloud ID not configured");
    }

    return {
      cloudId: user.jiraCloudId,
    };
  }
}

export type GetUserCloudIdUseCaseType = getReturnType<GetUserCloudIdUseCase>;
export type GetUserCloudIdUseCaseInput = void;
