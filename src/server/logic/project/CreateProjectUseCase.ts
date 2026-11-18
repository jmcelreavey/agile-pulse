import { GetProjectStateUseCase } from "~/server/logic/project/GetProjectStateUseCase";
import { type getReturnType, UseCase } from "~/server/logic/useCase";
import { GetValidURLTemplateUtil } from "~/shared/logic/project/GetValidURLTemplateUtil";
import { type State } from "~/shared/types/State";

export class CreateProjectUseCase extends UseCase {
  async execute(input: {
    name: string;
    description: string;
    colour?: string;
    state: State;
    ticketUrlTemplate?: string;
    ticketUrlPrefix?: string;
    domain?: string;
    jiraProjectKey?: string;
    jiraProjectId?: string;
  }) {
    const getProjectState = new GetProjectStateUseCase(this.db);
    const state = await getProjectState.execute({
      state: input.state,
    });

    let ticketUrlTemplate = input.ticketUrlTemplate;
    if (ticketUrlTemplate) {
      ticketUrlTemplate = GetValidURLTemplateUtil(ticketUrlTemplate);
    }

    const project = await this.db.project.create({
      data: { ...input, ...state, ticketUrlTemplate },
      select: {
        id: true,
        name: true,
        description: true,
        state: true,
      },
    });

    return project;
  }
}

export type CreateProjectType = getReturnType<CreateProjectUseCase>;
export type CreateProjectInput = Parameters<CreateProjectUseCase["execute"]>[0];
