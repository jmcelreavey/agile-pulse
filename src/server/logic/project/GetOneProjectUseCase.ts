import { type GetOneProjectInputType } from "~/server/api/schemas/project";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { isState } from "~/shared/types/State";

export class GetOneProjectUseCase extends UseCase {
  async execute(input: GetOneProjectInputType) {
    const project = await this.db.project.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        name: true,
        description: true,
        state: true,
        notes: true,
        sharedNotes: true,
        colour: true,
        ticketUrlPrefix: true,
        ticketUrlTemplate: true,
        jiraProjectKey: true,
        jiraProjectId: true,
        startedAt: true,
      },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    if (!isState(project.state)) {
      throw new Error("Invalid state");
    }

    return {
      ...project,
      state: project.state,
      colour: project.colour ?? undefined,
      ticketUrlPrefix: project.ticketUrlPrefix ?? undefined,
      ticketUrlTemplate: project.ticketUrlTemplate ?? undefined,
      jiraProjectKey: project.jiraProjectKey ?? undefined,
      jiraProjectId: project.jiraProjectId ?? undefined,
      startedAt: project.startedAt ?? undefined,
    };
  }
}

export type GetOneProjectUseCaseType = getReturnType<GetOneProjectUseCase>;
export type GetOneProjectInput = Parameters<GetOneProjectUseCase["execute"]>[0];
