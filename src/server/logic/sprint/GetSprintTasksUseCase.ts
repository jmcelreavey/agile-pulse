import { type GetSprintTasksInputType } from "~/server/api/schemas/sprint";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { type State } from "~/shared/types/State";

export class GetSprintTasksUseCase extends UseCase {
  async execute(input: GetSprintTasksInputType) {
    const tasks = await this.db.sprintTask.findMany({
      where: {
        sprintId: input.sprintId,
        deletedRecordId: null,
      },
      select: {
        order: true,
        ticketUrl: true,
        id: true,
        days: true,
        task: {
          select: {
            id: true,
            name: true,
            state: true,
            updatedAt: true,
            description: true,
            jiraIssueKey: true,
          },
        },
        sprint: {
          select: {
            projectId: true,
            reference: true,
            id: true,
          },
        },
        sprintMember: {
          select: {
            id: true,
            member: {
              select: {
                name: true,
                id: true,
              },
            },
            order: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    const flattenedTasks = tasks.map((t) => {
      return {
        id: t.id,
        name: t.task.name,
        description: t.task.description ?? "",
        days: t.days,
        state: t.task.state as State,
        updatedAt: t.task.updatedAt,
        assignedTo: t.sprintMember?.member.name ?? "Unassigned",
        sprintMemberId: t.sprintMember?.id,
        memberId: t.sprintMember?.member.id,
        memberName: t.sprintMember?.member.name,
        memberOrder: t.sprintMember?.order,
        sprintReference: t.sprint.reference,
        sprintId: t.sprint.id,
        ticketUrl: t.ticketUrl,
        order: t.order,
        projectId: t.sprint.projectId,
        jiraIssueKey: t.task.jiraIssueKey,
      };
    });

    return flattenedTasks;
  }
}

export type GetSprintTasksUseCaseType = getReturnType<GetSprintTasksUseCase>;
export type GetSprintTasksUseCaseInput = Parameters<
  GetSprintTasksUseCase["execute"]
>[0];
