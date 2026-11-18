import dayjs from "dayjs";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { isState } from "~/shared/types/State";

type ZoomInfo = {
  isFirstDay: boolean;
  isLastDay: boolean;
  previousDay: {
    number: number;
    date: Date | null;
    dayOfWeek: string | null;
  };
  currentDay: {
    number: number;
    date: Date | null;
    dayOfWeek: string | null;
  };
  nextDay: {
    number: number;
    date: Date | null;
    dayOfWeek: string | null;
  };
};

export class GetOneSprintUseCase extends UseCase {
  private getWorkingDateForDay(
    startDate: Date | null,
    targetDay: number
  ): Date | null {
    if (!startDate) return null;

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

  private calculateZoomInfo(
    sprint: {
      days: number;
      startedAt: Date | null;
    },
    zoomDay?: number
  ): ZoomInfo | null {
    if (!zoomDay) return null;

    const isFirstDay = zoomDay === 1;
    const isLastDay = zoomDay === sprint.days;

    return {
      isFirstDay,
      isLastDay,
      previousDay: {
        number: isFirstDay ? 0 : zoomDay - 1,
        date: this.getWorkingDateForDay(
          sprint.startedAt,
          isFirstDay ? -1 : zoomDay - 2
        ),
        dayOfWeek:
          sprint.startedAt && !isFirstDay
            ? dayjs(this.getWorkingDateForDay(sprint.startedAt, zoomDay - 2))
                .format("ddd")
                .toUpperCase()
            : null,
      },
      currentDay: {
        number: zoomDay,
        date: this.getWorkingDateForDay(sprint.startedAt, zoomDay - 1),
        dayOfWeek: sprint.startedAt
          ? dayjs(this.getWorkingDateForDay(sprint.startedAt, zoomDay - 1))
              .format("ddd")
              .toUpperCase()
          : null,
      },
      nextDay: {
        number: isLastDay ? sprint.days + 1 : zoomDay + 1,
        date: this.getWorkingDateForDay(
          sprint.startedAt,
          isLastDay ? sprint.days : zoomDay
        ),
        dayOfWeek:
          sprint.startedAt && !isLastDay
            ? dayjs(this.getWorkingDateForDay(sprint.startedAt, zoomDay))
                .format("ddd")
                .toUpperCase()
            : null,
      },
    };
  }

  async execute(input: { id: number; zoomDay?: number }) {
    const sprint = await this.db.sprint.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        reference: true,
        days: true,
        daysRemaining: true,
        state: true,
        notes: true,
        projectId: true,
        startedAt: true,
        completedAt: true,
        jiraSprintId: true,
        lastSyncedAt: true,
      },
    });

    if (!sprint) {
      throw new RecordNotFoundError("Sprint not found");
    }

    if (!isState(sprint.state)) {
      throw new RecordNotFoundError("Sprint is not in a valid state");
    }

    const state = sprint.state;
    const zoomInfo = this.calculateZoomInfo(sprint, input.zoomDay);

    return {
      ...sprint,
      state,
      zoom: zoomInfo,
      isZoomed: Boolean(input.zoomDay),
    };
  }
}

export type GetOneSprintUseCaseType = getReturnType<GetOneSprintUseCase>;
export type GetOneSprintUseCaseInput = Parameters<
  GetOneSprintUseCase["execute"]
>[0];
