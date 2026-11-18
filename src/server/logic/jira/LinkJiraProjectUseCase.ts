import type { LinkJiraProjectInput } from "~/server/api/schemas/jira";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class LinkJiraProjectUseCase extends UseCase {
  async execute(input: LinkJiraProjectInput): Promise<{ success: boolean }> {
    // Verify project exists and user has access
    const project = await this.db.project.findFirst({
      where: {
        id: input.projectId,
        // Add domain/ownership check if needed
      },
    });

    if (!project) {
      throw new RecordNotFoundError("Project not found");
    }

    await this.db.project.update({
      where: { id: input.projectId },
      data: {
        jiraProjectKey: input.jiraProjectKey,
        jiraProjectId: input.jiraProjectId,
      },
    });

    return { success: true };
  }
}

export type LinkJiraProjectUseCaseType = getReturnType<LinkJiraProjectUseCase>;
export type LinkJiraProjectUseCaseInput = Parameters<
  LinkJiraProjectUseCase["execute"]
>[0];
