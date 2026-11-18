import {
  UseCase,
  type getInputType,
  type getReturnType,
} from "~/server/logic/useCase";
import { State, isState } from "~/shared/types/State";

export class GetAllProjectsUseCase extends UseCase {
  async execute({ domain }: { domain?: string }) {
    const projects = await this.db.project.findMany({
      where: {
        domain,
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        state: true,
        startedAt: true,
        completedAt: true,
        updatedAt: true,
        _count: {
          select: {
            sprints: {
              where: {
                snapshotId: null,
                deletedRecordId: null,
              },
            },
          },
        },
        description: true,
        colour: true,
        ticketUrlTemplate: true,
        ticketUrlPrefix: true,
        jiraProjectKey: true,
        jiraProjectId: true,
        sprints: {
          take: 1,
          orderBy: {
            updatedAt: "desc",
          },
          select: {
            id: true,
            reference: true,
          },
        },
      },
    });

    return projects.map((project) => {
      const { sprints, _count, ...rest } = project;

      let state = State.NOT_STARTED;
      if (isState(rest.state)) {
        state = rest.state;
      }

      return {
        ...rest,
        state,
        sprintsCount: _count.sprints,
        lastUpdatedSprint: sprints[0],
      };
    });
  }
}

export type GetAllProjectsType = getReturnType<GetAllProjectsUseCase>;
export type GetAllProjectsInput = getInputType<GetAllProjectsUseCase>;
