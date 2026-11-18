import dayjs from "dayjs";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import {
  columnCountForDays,
  elapsedSprintDays,
} from "~/shared/logic/sprint/chart/timelineScale";
import { type State } from "~/shared/types/State";

type ZoomWindow = {
  startDay: number;
  endDay: number;
  visibleDays: number;
};

export class GetSprintMembersUseCase extends UseCase {
  private calculateZoomWindow(
    zoomDay: number | undefined,
    maxDays: number,
  ): ZoomWindow | null {
    if (!zoomDay) return null;

    const maxWholeDays = columnCountForDays(maxDays);
    const isFirstDay = zoomDay === 1;
    const isLastDay = zoomDay === maxWholeDays;

    const window = {
      startDay: isFirstDay ? 1 : zoomDay - 1,
      endDay: isLastDay ? maxWholeDays : zoomDay + 1,
      visibleDays: isFirstDay || isLastDay ? 2 : 3,
    };

    return window;
  }

  private getWorkingDateForDay(
    startDate: Date | null,
    targetDay: number,
  ): Date {
    if (!startDate) {
      return new Date(); // Return current date as fallback
    }

    let currentDate = dayjs(startDate);
    let workingDays = 0;

    if (targetDay === 0) return startDate;

    while (workingDays < targetDay) {
      currentDate = currentDate.add(1, "day");
      if (currentDate.day() !== 0 && currentDate.day() !== 6) {
        workingDays++;
      }
    }

    while (currentDate.day() === 0 || currentDate.day() === 6) {
      currentDate = currentDate.add(1, "day");
    }

    return currentDate.toDate();
  }

  private generateTimelineDays(
    sprint: { startedAt: Date | null; days: number } | null,
    zoomWindow: ZoomWindow | null,
    maxDays: number,
  ) {
    // Only generate days within the zoom window if it exists
    const daysToGenerate = zoomWindow
      ? Array.from(
          { length: zoomWindow.visibleDays },
          (_, i) => zoomWindow.startDay + i,
        )
      : Array.from({ length: columnCountForDays(maxDays) }, (_, i) => i + 1);

    return daysToGenerate.map((dayNumber) => {
      const date = sprint?.startedAt
        ? this.getWorkingDateForDay(sprint.startedAt, dayNumber - 1)
        : new Date();

      // Calculate percentage - all days get equal distribution for consistent task alignment
      const percentage = 100 / daysToGenerate.length;

      return {
        number: dayNumber,
        date,
        dayOfWeek: sprint?.startedAt
          ? dayjs(date).format("ddd").toUpperCase()
          : "",
        percentage,
      };
    });
  }

  async execute({ sprintId, zoomDay }: { sprintId: number; zoomDay?: number }) {
    const members = await this.db.sprintMember.findMany({
      where: {
        sprintId,
        deletedRecordId: null,
      },
      select: {
        id: true,
        order: true,
        sprint: {
          select: {
            id: true,
            projectId: true,
            reference: true,
          },
        },
        member: {
          select: {
            name: true,
            id: true,
          },
        },
        sprintTasks: {
          where: {
            deletedRecordId: null,
          },
          select: {
            id: true,
            days: true,
            order: true,
            ticketUrl: true,
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
          },
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    const sprint = await this.db.sprint.findUnique({
      where: { id: sprintId },
      select: { startedAt: true, days: true, daysRemaining: true },
    });

    // The chart is as long as the longest lane, the planned sprint, or the
    // time already spent (so an overrunning sprint still shows today).
    const maxDays = Math.max(
      ...members.map((m) =>
        m.sprintTasks.reduce((sum, task) => sum + task.days, 0),
      ),
      sprint?.days ?? 0,
      sprint ? elapsedSprintDays(sprint) : 0,
    );

    const zoomWindow = this.calculateZoomWindow(zoomDay, maxDays);
    const timelineDays = this.generateTimelineDays(sprint, zoomWindow, maxDays);

    // Add zoom information to the sprint data
    const zoomData = zoomWindow
      ? {
          previousDay: timelineDays[0],
          currentDay: timelineDays[1],
          nextDay: timelineDays.length > 2 ? timelineDays[2] : null,
        }
      : null;

    const flattenedTeam = members.map((t) => {
      const totalTaskDays = t.sprintTasks.reduce(
        (sum, task) => sum + task.days,
        0,
      );

      const tasks = t.sprintTasks
        .map((task, index) => {
          const previousTasksDays = t.sprintTasks
            .slice(0, index)
            .reduce((sum, t) => sum + t.days, 0);
          const taskDayExact = previousTasksDays + 1;
          const taskDay = Math.floor(taskDayExact);
          const taskEndDay = taskDayExact + task.days;

          let visibleDays = task.days;
          // Calculate percentage relative to the number of timeline sections (not maxDays)
          // This ensures tasks align properly with the equal-width timeline sections
          const timelineSections = columnCountForDays(maxDays);
          let visiblePercentage = (task.days / timelineSections) * 100;

          if (zoomWindow) {
            // First, determine if the task should be visible at all
            const overlapsWithWindow =
              taskDay <= zoomWindow.endDay && taskEndDay > zoomWindow.startDay;

            if (!overlapsWithWindow) {
              return null;
            }

            // Calculate how much of the task falls into each day of the window
            const taskStartInWindow = Math.max(
              taskDayExact,
              zoomWindow.startDay,
            );
            const taskEndInWindow = Math.min(taskEndDay, zoomWindow.endDay + 1);

            // Calculate the visible portion
            visibleDays = Math.max(0, taskEndInWindow - taskStartInWindow);

            // For tasks that cross day boundaries
            if (Math.floor(taskStartInWindow) !== Math.floor(taskEndInWindow)) {
              // If this is a task that starts in a previous day
              if (taskDay < zoomWindow.startDay) {
                visibleDays = taskEndInWindow - zoomWindow.startDay;
              }
              // If this is a task that ends in the next day
              else if (taskEndDay > zoomWindow.endDay + 1) {
                visibleDays = zoomWindow.endDay + 1 - taskStartInWindow;
              }
            }

            // Ensure we don't show more than the task's total days
            visibleDays = Math.min(visibleDays, task.days);

            visiblePercentage = (visibleDays / zoomWindow.visibleDays) * 100;
          }

          return {
            id: task.id,
            name: task.task.name,
            description: task.task.description ?? "",
            state: task.task.state as State,
            updatedAt: task.task.updatedAt,
            assignedTo: t.member.name,
            sprintMemberId: t.id,
            memberId: t.member.id,
            memberName: t.member.name,
            memberOrder: t.order,
            sprintId: t.sprint.id,
            ticketUrl: task.ticketUrl,
            projectId: t.sprint.projectId,
            sprintReference: t.sprint.reference,
            totalDays: task.days,
            days: visibleDays,
            order: taskDayExact,
            percentage: visiblePercentage,
            jiraIssueKey: task.task.jiraIssueKey,
          };
        })
        .filter((task): task is NonNullable<typeof task> => task !== null);

      return {
        name: t.member.name,
        id: t.id,
        order: t.order,
        projectId: t.sprint.projectId,
        sprintId: t.sprint.id,
        totalTaskDays,
        tasks,
        timelineDays,
        maxDays,
      };
    });

    const result = flattenedTeam.map((member) => ({
      ...member,
      timelineDays,
      maxDays,
      zoom: zoomData,
    }));

    return result;
  }
}

export type GetSprintMembersUseCaseType =
  getReturnType<GetSprintMembersUseCase>;
export type GetSprintMembersUseCaseInput = Parameters<
  GetSprintMembersUseCase["execute"]
>[0];
