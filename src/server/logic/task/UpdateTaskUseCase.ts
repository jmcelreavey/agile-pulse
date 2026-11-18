import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { GenerateTaskTicketURLUseCase } from "~/server/logic/sprint/GenerateTaskTicketURLUseCase";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { type State } from "~/shared/types/State";

export class UpdateTaskUseCase extends UseCase {
  async execute(input: {
    id: number;
    name: string;
    description?: string;
    state: State;
  }) {
    try {
      const task = await this.db.task.update({
        where: { id: input.id },
        data: input,
      });

      // Get all sprint tasks associated with this task
      const sprintTasks = await this.db.sprintTask.findMany({
        where: {
          taskId: input.id,
        },
        select: {
          id: true,
          sprintId: true,
        },
      });

      const generateTicketURL = new GenerateTaskTicketURLUseCase(this.db);

      // For each sprint task, recalculate and update the ticket URL
      for (const sprintTask of sprintTasks) {
        const ticketUrl = await generateTicketURL.execute({
          taskId: input.id,
          sprintId: sprintTask.sprintId,
          taskName: input.name,
          taskDescription: input.description,
        });

        // Update the ticket URL in the sprint task
        if (ticketUrl !== undefined) {
          await this.db.sprintTask.update({
            where: { id: sprintTask.id },
            data: { ticketUrl },
          });
        }
      }

      return task;
    } catch (error) {
      console.error(error);
      throw new RecordNotFoundError("Task not found");
    }
  }
}

export type UpdateTaskType = getReturnType<UpdateTaskUseCase>;
export type UpdateTaskInput = Parameters<UpdateTaskUseCase["execute"]>[0];
