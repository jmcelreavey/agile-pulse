import { randomToken } from "~/server/integrations/signature";
import { forecastFor } from "~/server/logic/insights/SprintInsightsUseCase";
import { LoadSprintChartUseCase } from "~/server/logic/insights/LoadSprintChartUseCase";
import { UseCase } from "~/server/logic/useCase";
import { buildICalendar, type CalendarEvent } from "~/shared/logic/insights/ical";
import { dateOfSprintDay } from "~/shared/logic/insights/workingDays";
import { etaFromForecast } from "~/shared/logic/insights/weeklyUpdate";
import { site } from "~/shared/site";
import { State } from "~/shared/types/State";

export class ShareLinkUseCase extends UseCase {
  list(sprintId: number) {
    return this.db.shareLink.findMany({ where: { sprintId, revokedAt: null }, orderBy: { createdAt: "desc" } });
  }

  create(sprintId: number, userId: number) {
    return this.db.shareLink.create({ data: { sprintId, createdById: userId, token: randomToken(18) } });
  }

  async revoke(id: number) {
    await this.db.shareLink.update({ where: { id }, data: { revokedAt: new Date() } });
    return { id };
  }

  private async resolve(token: string) {
    if (!/^[\w-]{8,64}$/.test(token)) return null;
    return this.db.shareLink.findFirst({ where: { token, revokedAt: null }, select: { sprintId: true } });
  }

  /** The read-only view behind a public link, or null when the link is unknown or revoked. */
  async getShared(token: string) {
    const link = await this.resolve(token);
    if (!link) return null;
    const chart = await new LoadSprintChartUseCase(this.db).execute({ sprintId: link.sprintId });
    const forecast = forecastFor(chart);
    const deadlines = await this.db.sprintDeadline.findMany({
      where: { sprintId: link.sprintId },
      select: { day: true, deadline: { select: { name: true, colour: true } } },
      orderBy: { day: "asc" },
    });
    return {
      sprint: chart.sprint,
      lanes: chart.current.lanes.map((lane) => ({ member: lane.member, tasks: lane.tasks.map(({ key, name, days, state }) => ({ key, name, days, state })) })),
      deadlines: deadlines.map((d) => ({ day: d.day, name: d.deadline.name, colour: d.deadline.colour })),
      forecast: { ...forecast, atRisk: forecast.atRisk.map(({ sprintTaskId: _id, ...risk }) => risk) },
      eta: etaFromForecast(forecast),
      calendarUrl: `${site.url}/api/calendar/${token}.ics`,
    };
  }

  /** iCal feed of deadlines, sprint ends and the forecast landing for the shared sprint's project. */
  async calendar(token: string) {
    const link = await this.resolve(token);
    if (!link) return null;
    const shared = await this.db.sprint.findUnique({ where: { id: link.sprintId }, select: { projectId: true, project: { select: { name: true } } } });
    if (!shared) return null;
    const sprints = await this.db.sprint.findMany({
      where: { projectId: shared.projectId, snapshotId: null, startedAt: { not: null } },
      select: {
        id: true,
        reference: true,
        days: true,
        state: true,
        startedAt: true,
        sprintDeadlines: { select: { id: true, day: true, deadline: { select: { name: true, description: true } } } },
      },
    });
    const events: CalendarEvent[] = [];
    const shareUrl = `${site.url}/share/${token}`;
    for (const sprint of sprints) {
      if (!sprint.startedAt) continue;
      for (const deadline of sprint.sprintDeadlines) {
        events.push({
          uid: `deadline-${deadline.id}@agile-pulse`,
          title: `${deadline.deadline.name} (Sprint ${sprint.reference})`,
          date: dateOfSprintDay(sprint.startedAt, deadline.day),
          description: deadline.deadline.description ?? undefined,
        });
      }
      events.push({ uid: `sprint-end-${sprint.id}@agile-pulse`, title: `Sprint ${sprint.reference} ends`, date: dateOfSprintDay(sprint.startedAt, sprint.days) });
      if (sprint.state === String(State.IN_PROGRESS)) {
        const chart = await new LoadSprintChartUseCase(this.db).execute({ sprintId: sprint.id });
        const eta = etaFromForecast(forecastFor(chart));
        events.push({
          uid: `sprint-forecast-${sprint.id}@agile-pulse`,
          title: `Sprint ${sprint.reference} forecast to land`,
          date: eta.date,
          description: eta.text,
          url: sprint.id === link.sprintId ? shareUrl : undefined,
        });
      }
    }
    return buildICalendar(`${shared.project.name} (Agile Pulse)`, events);
  }
}
