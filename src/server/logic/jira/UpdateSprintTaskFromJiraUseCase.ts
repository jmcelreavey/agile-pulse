import { UseCase } from "~/server/logic/useCase";
import { type JiraTaskData } from "~/shared/logic/jira/JiraToTaskMapperUtil";
import { GenerateTaskTicketURLUseCase } from "~/server/logic/sprint/GenerateTaskTicketURLUseCase";

interface UpdateSprintTaskFromJiraInput {
  existingTask: {
    id: number;
    sprintId: number;
    task: {
      id: number;
      jiraIssueKey: string | null;
    };
  };
  taskData: JiraTaskData;
  assignedMember: {
    id: number;
    name: string;
  } | null;
}

interface UpdateSprintTaskFromJiraOutput {
  success: boolean;
}

/**
 * UseCase to update an existing sprint task with data from Jira
 */
export class UpdateSprintTaskFromJiraUseCase extends UseCase {
  async execute(
    input: UpdateSprintTaskFromJiraInput
  ): Promise<UpdateSprintTaskFromJiraOutput> {
    const { existingTask, taskData, assignedMember } = input;

    // Update the task with Jira data (Jira takes precedence)
    const taskUpdateData = {
      name: taskData.name,
      description: taskData.description,
      state: taskData.state,
      jiraIssueKey: taskData.jiraIssueKey,
      jiraIssueId: taskData.jiraIssueId,
      jiraIssueType: taskData.jiraIssueType,
    };

    await this.db.task.update({
      where: { id: existingTask.task.id },
      data: taskUpdateData,
    });

    // Calculate ticket URL if custom ticket linking is configured
    const generateTicketURL = new GenerateTaskTicketURLUseCase(this.db);
    const ticketUrl = await generateTicketURL.execute({
      taskId: existingTask.task.id,
      sprintId: existingTask.sprintId,
      taskName: taskData.name,
      taskDescription: taskData.description ?? undefined,
    });

    // Update ticketUrl if available
    if (ticketUrl !== undefined) {
      await this.db.sprintTask.update({
        where: { id: existingTask.id },
        data: {
          ticketUrl,
        },
      });
    }

    // Update assignment if needed
    if (assignedMember) {
      const sprintMember = await this.db.sprintMember.findFirst({
        where: {
          sprintId: existingTask.sprintId,
          memberId: assignedMember.id,
          deletedRecordId: null,
        },
      });

      if (sprintMember) {
        await this.db.sprintTask.update({
          where: { id: existingTask.id },
          data: { sprintMemberId: sprintMember.id },
        });
      }
    } else {
      // Unassign task
      await this.db.sprintTask.update({
        where: { id: existingTask.id },
        data: { sprintMemberId: null },
      });
    }

    return {
      success: true,
    };
  }
}

export type UpdateSprintTaskFromJiraUseCaseType =
  UpdateSprintTaskFromJiraUseCase;
export type UpdateSprintTaskFromJiraUseCaseInput =
  UpdateSprintTaskFromJiraInput;
export type UpdateSprintTaskFromJiraUseCaseOutput =
  UpdateSprintTaskFromJiraOutput;
