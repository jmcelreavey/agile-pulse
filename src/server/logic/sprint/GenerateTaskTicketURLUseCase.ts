import { UseCase } from "~/server/logic/useCase";
import { GetTaskTicketURLUtil } from "~/shared/logic/project/GetTaskTicketURLUtil";

/**
 * UseCase to generate a ticket URL for a task based on the project's custom ticket URL configuration
 * Checks both task name and description for ticket IDs
 */
export class GenerateTaskTicketURLUseCase extends UseCase {
  async execute(input: {
    taskId?: number;
    sprintId: number;
    taskName?: string;
    taskDescription?: string;
  }): Promise<string | undefined> {
    // If we have the task name/description directly, use them
    // Otherwise get the task details from the database
    let name = input.taskName;
    let description = input.taskDescription;

    if ((!name || !description) && input.taskId) {
      const task = await this.db.task.findFirst({
        where: { id: input.taskId },
        select: {
          name: true,
          description: true,
        },
      });

      if (!name) name = task?.name;
      if (!description) description = task?.description ?? undefined;
    }

    // Get project info from the sprint to check for custom ticket URL configuration
    const sprint = await this.db.sprint.findFirst({
      where: { id: input.sprintId },
      select: {
        project: {
          select: {
            ticketUrlTemplate: true,
            ticketUrlPrefix: true,
          },
        },
      },
    });

    if (sprint?.project.ticketUrlTemplate && sprint.project.ticketUrlPrefix) {
      // Check the task name first
      if (name) {
        const nameTicketUrl = GetTaskTicketURLUtil({
          ticketUrlPrefix: sprint.project.ticketUrlPrefix,
          ticketUrlTemplate: sprint.project.ticketUrlTemplate,
          task: name,
        });

        if (nameTicketUrl) {
          return nameTicketUrl;
        }
      }

      // If no match in the name, check the description
      if (description) {
        const descriptionTicketUrl = GetTaskTicketURLUtil({
          ticketUrlPrefix: sprint.project.ticketUrlPrefix,
          ticketUrlTemplate: sprint.project.ticketUrlTemplate,
          task: description,
        });

        if (descriptionTicketUrl) {
          return descriptionTicketUrl;
        }
      }
    }

    return undefined;
  }
}
