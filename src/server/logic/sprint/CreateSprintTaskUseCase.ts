import { GenerateTaskTicketURLUseCase } from "~/server/logic/sprint/GenerateTaskTicketURLUseCase";
import { type getReturnType, UseCase } from "~/server/logic/useCase";

export class CreateSprintTaskUseCase extends UseCase {
  async execute(input: {
    taskId: number;
    sprintMemberId?: number | null;
    sprintId: number;
    days: number;
    order?: number;
  }) {
    let order = input.order;

    if (!order && input.sprintMemberId) {
      order = await this.getMaxOrder(input.sprintId, input.sprintMemberId);
    }

    const generateTicketURL = new GenerateTaskTicketURLUseCase(this.db);
    const ticketUrl = await generateTicketURL.execute({
      taskId: input.taskId,
      sprintId: input.sprintId,
    });

    const task = await this.db.sprintTask.create({
      data: {
        taskId: input.taskId,
        sprintMemberId: input.sprintMemberId,
        sprintId: input.sprintId,
        days: input.days,
        order: order ?? 0,
        ticketUrl,
      },
      select: {
        id: true,
        taskId: true,
        sprintMemberId: true,
        sprint: {
          select: {
            projectId: true,
            id: true,
          },
        },
      },
    });

    return {
      ...task,
      projectId: task.sprint.projectId,
      sprintId: task.sprint.id,
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

export type AssignTaskUseCaseType = getReturnType<CreateSprintTaskUseCase>;
export type AssignTaskUseCaseInput = Parameters<
  CreateSprintTaskUseCase["execute"]
>[0];
