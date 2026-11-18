import type { UnlinkJiraProjectInput } from "~/server/api/schemas/jira";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

interface UnlinkJiraProjectOutput {
  success: boolean;
}

export class UnlinkJiraProjectUseCase extends UseCase {
  async execute(
    input: UnlinkJiraProjectInput
  ): Promise<UnlinkJiraProjectOutput> {
    await this.db.project.update({
      where: { id: input.projectId },
      data: {
        jiraProjectKey: null,
        jiraProjectId: null,
      },
    });

    // Also clear Jira data from related sprints
    await this.db.sprint.updateMany({
      where: { projectId: input.projectId },
      data: {
        jiraSprintId: null,
        lastSyncedAt: null,
      },
    });

    return { success: true };
  }
}

export type UnlinkJiraProjectUseCaseType =
  getReturnType<UnlinkJiraProjectUseCase>;
export type UnlinkJiraProjectUseCaseInput = Parameters<
  UnlinkJiraProjectUseCase["execute"]
>[0];
