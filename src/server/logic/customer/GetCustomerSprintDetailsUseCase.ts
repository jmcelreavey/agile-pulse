import { NotAuthorisedError } from "~/server/errors/NotAuthorisedError";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { type State } from "~/shared/types/State";

export class GetCustomerSprintDetailsUseCase extends UseCase {
  async execute(input: {
    customerId: number;
    projectId: number;
    sprintId: number;
  }) {
    // Get the customer record first to validate they exist
    const customer = await this.db.customer.findUnique({
      where: {
        id: input.customerId,
      },
    });

    if (!customer) {
      throw new RecordNotFoundError("Customer not found");
    }

    // Check if customer has access to this project via accepted invitation
    const invitation = await this.db.customerInvitation.findFirst({
      where: {
        email: customer.email,
        projectId: input.projectId,
        status: "accepted",
      },
    });

    if (!invitation) {
      throw new NotAuthorisedError("You don't have access to this project");
    }

    // Fetch sprint details with task information and published changelogs
    const sprint = await this.db.sprint.findFirst({
      where: {
        id: input.sprintId,
        projectId: input.projectId,
      },
      select: {
        id: true,
        reference: true,
        state: true,
        days: true,
        startedAt: true,
        completedAt: true,
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            colour: true,
          },
        },
        // Include sprint tasks for customer view (exclude internal team states)
        sprintTasks: {
          where: {
            deletedRecordId: null,
            task: {
              state: {
                notIn: ["Leave", "Distraction"],
              },
            },
          },
          select: {
            id: true,
            days: true,
            task: {
              select: {
                id: true,
                name: true,
                description: true,
                state: true,
              },
            },
            sprintMember: {
              select: {
                member: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
        // Include only published changelogs
        changelogs: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            sharedAt: true,
            sharedViaEmail: true,
            exportedToPdf: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!sprint) {
      throw new RecordNotFoundError("Sprint not found");
    }

    // Calculate sprint progress metrics for customer view
    const totalTasks = sprint.sprintTasks.length;
    const completedTasks = sprint.sprintTasks.filter(
      (task) => task.task.state === "Completed"
    ).length;

    // For customers: group working states as "in progress", blocked states as "to do"
    const inProgressTasks = sprint.sprintTasks.filter((task) => {
      const state = task.task.state;
      return (
        state === "In Progress" ||
        state === "With QA" ||
        state === "Sign-off Required"
      );
    }).length;

    // Calculate days remaining
    let daysRemaining = 0;

    if (sprint.state === "In Progress" && sprint.startedAt) {
      const daysSinceStart = Math.floor(
        (Date.now() - new Date(sprint.startedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      daysRemaining = Math.max(0, sprint.days - daysSinceStart);
    } else if (sprint.state === "Not Started") {
      daysRemaining = sprint.days;
    }

    return {
      ...sprint,
      state: sprint.state as State,
      daysRemaining,
      metrics: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        progressPercentage:
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      // Transform tasks for customer view (exclude estimates)
      tasks: sprint.sprintTasks.map((sprintTask) => ({
        id: sprintTask.task.id,
        name: sprintTask.task.name,
        description: sprintTask.task.description || "",
        state: sprintTask.task.state as State,
        assignedTo: sprintTask.sprintMember?.member.name || "Unassigned",
      })),
    };
  }
}

export type GetCustomerSprintDetailsType =
  getReturnType<GetCustomerSprintDetailsUseCase>;
