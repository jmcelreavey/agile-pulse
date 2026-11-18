import { GenerateTaskTicketURLUseCase } from "~/server/logic/sprint/GenerateTaskTicketURLUseCase";
import { type getReturnType, UseCase } from "~/server/logic/useCase";
import { type State } from "~/shared/types/State";

export class UpdateSprintTaskUseCase extends UseCase {
  async execute(input: {
    id: number;
    sprintMemberId: number | null;
    sprintId: number;
    days: number;
    name: string;
    description?: string;
    state: State;
  }) {
    const sprintTask = await this.db.sprintTask.update({
      where: {
        id: input.id,
      },
      data: {
        sprintMemberId: input.sprintMemberId,
        sprintId: input.sprintId,
        days: input.days,
      },
      select: {
        id: true,
        taskId: true,
        sprint: {
          select: {
            projectId: true,
            id: true,
          },
        },
      },
    });

    await this.db.task.update({
      where: {
        id: sprintTask.taskId,
      },
      data: {
        state: input.state,
        name: input.name,
        description: input.description,
      },
    });

    // Recalculate and update the ticketUrl after task name update
    const generateTicketURL = new GenerateTaskTicketURLUseCase(this.db);
    const ticketUrl = await generateTicketURL.execute({
      taskId: sprintTask.taskId,
      sprintId: input.sprintId,
      taskName: input.name,
      taskDescription: input.description,
    });

    if (ticketUrl !== undefined) {
      await this.db.sprintTask.update({
        where: { id: sprintTask.id },
        data: { ticketUrl },
      });
    }

    return {
      ...sprintTask,
      projectId: sprintTask.sprint.projectId,
      sprintId: sprintTask.sprint.id,
    };
  }

  getMaxOrder = async (sprintId: number, sprintMemberId: number | null) => {
    const maxOrder = await this.db.sprintTask.findFirst({
      where: {
        sprintId,
        sprintMemberId,
      },
      orderBy: {
        order: "desc",
      },
    });

    return maxOrder ? maxOrder.order + 1 : 1;
  };
}

export type UpdateTaskUseCaseType = getReturnType<UpdateSprintTaskUseCase>;
export type UpdateTaskUseCaseInput = Parameters<
  UpdateSprintTaskUseCase["execute"]
>[0];
