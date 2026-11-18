import { UseCase } from "~/server/logic/useCase";
import { type JiraTaskData } from "~/shared/logic/jira/JiraToTaskMapperUtil";
import { GenerateTaskTicketURLUseCase } from "~/server/logic/sprint/GenerateTaskTicketURLUseCase";

interface CreateSprintTaskFromJiraInput {
  sprintId: number;
  taskData: JiraTaskData;
  assignedMember: {
    id: number;
    name: string;
  } | null;
}

interface CreateSprintTaskFromJiraOutput {
  success: boolean;
  taskId: number;
  sprintTaskId: number;
}

/**
 * UseCase to create a new sprint task from Jira data
 */
export class CreateSprintTaskFromJiraUseCase extends UseCase {
  async execute(
    input: CreateSprintTaskFromJiraInput
  ): Promise<CreateSprintTaskFromJiraOutput> {
    const { sprintId, taskData, assignedMember } = input;

    // Create the task
    const taskCreateData = {
      name: taskData.name,
      description: taskData.description,
      state: taskData.state,
      jiraIssueKey: taskData.jiraIssueKey,
      jiraIssueId: taskData.jiraIssueId,
      jiraIssueType: taskData.jiraIssueType,
    };

    const task = await this.db.task.create({
      data: taskCreateData,
    });

    // Find the sprint member if assigned
    let sprintMemberId = null;
    if (assignedMember) {
      const sprintMember = await this.db.sprintMember.findFirst({
        where: {
          sprintId: sprintId,
          memberId: assignedMember.id,
          deletedRecordId: null,
        },
      });
      sprintMemberId = sprintMember?.id || null;
    }

    // Get the next order for the task
    const lastTask = await this.db.sprintTask.findFirst({
      where: {
        sprintId: sprintId,
        sprintMemberId: sprintMemberId,
        deletedRecordId: null,
      },
      orderBy: { order: "desc" },
    });

    const nextOrder = (lastTask?.order || 0) + 1;

    // Calculate ticket URL if custom ticket linking is configured
    const generateTicketURL = new GenerateTaskTicketURLUseCase(this.db);
    const ticketUrl = await generateTicketURL.execute({
      taskId: task.id,
      sprintId: sprintId,
      taskName: taskData.name,
      taskDescription: taskData.description ?? undefined,
    });

    // Create the sprint task
    const sprintTask = await this.db.sprintTask.create({
      data: {
        sprintId: sprintId,
        taskId: task.id,
        sprintMemberId: sprintMemberId,
        days: 1,
        order: nextOrder,
        ticketUrl,
      },
    });

    return {
      success: true,
      taskId: task.id,
      sprintTaskId: sprintTask.id,
    };
  }
}

export type CreateSprintTaskFromJiraUseCaseType =
  CreateSprintTaskFromJiraUseCase;
export type CreateSprintTaskFromJiraUseCaseInput =
  CreateSprintTaskFromJiraInput;
export type CreateSprintTaskFromJiraUseCaseOutput =
  CreateSprintTaskFromJiraOutput;
