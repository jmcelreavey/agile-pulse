import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { GetProjectStateUseCase } from "~/server/logic/project/GetProjectStateUseCase";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { GetValidURLTemplateUtil } from "~/shared/logic/project/GetValidURLTemplateUtil";

export class UpdateProjectUseCase extends UseCase {
  getProjectState = new GetProjectStateUseCase(this.db);
  async execute(input: {
    id: number;
    name: string;
    description: string;
    ticketUrlTemplate?: string;
    ticketUrlPrefix?: string;
    colour?: string;
    state: string;
    jiraProjectKey?: string;
    jiraProjectId?: string;
  }) {
    const state = await this.getProjectState.execute({
      id: input.id,
    });

    let ticketUrlTemplate = input.ticketUrlTemplate;
    if (ticketUrlTemplate) {
      ticketUrlTemplate = GetValidURLTemplateUtil(ticketUrlTemplate);
    }

    try {
      const project = await this.db.project.update({
        where: { id: input.id },
        data: { ...input, ...state, ticketUrlTemplate },
      });

      return project;
    } catch (error) {
      console.error(error);
      throw new RecordNotFoundError("Project not found");
    }
  }
}

export type UpdateProjectType = getReturnType<UpdateProjectUseCase>;
export type UpdateProjectInput = Parameters<UpdateProjectUseCase["execute"]>[0];
