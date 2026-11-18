import { complete } from "~/server/ai/openai";
import { env } from "~/env";
import { LoadSprintChartUseCase, type SprintChart } from "~/server/logic/insights/LoadSprintChartUseCase";
import { UseCase } from "~/server/logic/useCase";
import { computeForecast, type Forecast } from "~/shared/logic/insights/forecast";
import { focusFactorFromHistory, parseBacklog, planSprint, type BacklogItem } from "~/shared/logic/insights/planner";
import { generateRetro } from "~/shared/logic/insights/retro";
import { buildStandup } from "~/shared/logic/insights/standup";
import { isTimeOff, normaliseHistory } from "~/shared/logic/insights/types";
import { draftWeeklyUpdate, etaFromForecast } from "~/shared/logic/insights/weeklyUpdate";
import { State } from "~/shared/types/State";

export const forecastFor = (chart: SprintChart, now = new Date()) =>
  computeForecast(chart.current, { history: chart.history, links: chart.links, now, stalePrDays: env.STALE_PR_DAYS });

/** Forecast, standup, retro, weekly update and planner for one sprint, built on one chart load. */
export class SprintInsightsUseCase extends UseCase {
  private load(sprintId: number) {
    return new LoadSprintChartUseCase(this.db).execute({ sprintId });
  }

  async forecast(sprintId: number) {
    const chart = await this.load(sprintId);
    return { sprint: chart.sprint, forecast: forecastFor(chart), eta: etaFromForecast(forecastFor(chart)) };
  }

  /** One sentence on why the sprint is where it is. Built in, or from OpenAI when a key is set. */
  async explainForecast(sprintId: number) {
    const chart = await this.load(sprintId);
    const forecast = forecastFor(chart);
    const fallback = builtInWhy(forecast);
    const ai = await complete(
      "You are a calm delivery lead. In one sentence of at most 30 words, explain the main reason a sprint forecast looks the way it does. Plain British English, no hype, no bullet points, refer to tasks by name.",
      JSON.stringify({
        summary: forecast.summary,
        pace: forecast.pace,
        scopeAddedDays: forecast.scopeAddedDays,
        atRisk: forecast.atRisk.slice(0, 5).map((task) => ({ task: task.name, reasons: task.reasons.map((r) => r.text) })),
      }),
      { maxTokens: 80 }
    );
    return { why: ai ?? fallback, source: ai ? ("openai" as const) : ("built-in" as const) };
  }

  async standup(sprintId: number) {
    const chart = await this.load(sprintId);
    const history = normaliseHistory(chart.history).filter((state) => state.day < chart.current.day);
    const previous = history.at(-1) ?? null;
    return { sprint: chart.sprint, standup: buildStandup(previous, chart.current, forecastFor(chart)) };
  }

  async retro(sprintId: number) {
    const chart = await this.load(sprintId);
    return { sprint: chart.sprint, retro: generateRetro(chart.history, chart.current) };
  }

  async weeklyUpdate(sprintId: number, now = new Date()) {
    const chart = await this.load(sprintId);
    const forecast = forecastFor(chart, now);
    const tasks = [...chart.current.lanes.flatMap((lane) => lane.tasks), ...chart.current.unassigned].filter((task) => !isTimeOff(task));
    const weekAgo = normaliseHistory(chart.history).filter((state) => state.day <= chart.current.day - 5).at(-1);
    const doneBefore = new Set(
      (weekAgo ? [...weekAgo.lanes.flatMap((lane) => lane.tasks), ...weekAgo.unassigned] : [])
        .filter((task) => task.state === State.COMPLETED)
        .map((task) => task.key)
    );
    const update = draftWeeklyUpdate({
      projectName: chart.sprint.projectName,
      sprintReference: chart.sprint.reference,
      completed: tasks.filter((task) => task.state === State.COMPLETED && !doneBefore.has(task.key)).map((task) => task.name),
      inProgress: tasks
        .filter((task) => [State.IN_PROGRESS, State.WITH_QA, State.SIGN_OFF_REQUIRED, State.AT_RISK, State.BLOCKED].includes(task.state))
        .map((task) => task.name),
      upNext: tasks.filter((task) => task.state === State.NOT_STARTED).slice(0, 5).map((task) => task.name),
      forecast,
      today: now,
    });
    const polished = await complete(
      "Rewrite this customer project update in warm, plain British English. Keep the same facts, headings and bullet points, keep it short, and never add anything that isn't in the input. Return markdown only.",
      update.markdown,
      { maxTokens: 500 }
    );
    return { ...update, markdown: polished ?? update.markdown, source: polished ? ("openai" as const) : ("built-in" as const) };
  }

  /** Members, leave and focus factors for the planner, from this sprint and recent completed ones. */
  private async plannerMembers(chart: SprintChart) {
    const previous = await this.db.sprint.findMany({
      where: { projectId: chart.sprint.projectId, state: State.COMPLETED, id: { not: chart.sprint.id }, snapshotId: null },
      orderBy: { completedAt: "desc" },
      take: 3,
      select: { id: true },
    });
    const history = await Promise.all(previous.map((sprint) => new LoadSprintChartUseCase(this.db).execute({ sprintId: sprint.id, withHistory: false })));
    const byMember = new Map<string, { planned: number; completed: number }[]>();
    for (const past of history) {
      for (const lane of past.current.lanes) {
        const work = lane.tasks.filter((task) => !isTimeOff(task));
        const entry = {
          planned: work.reduce((sum, task) => sum + task.days, 0),
          completed: work.filter((task) => task.state === State.COMPLETED).reduce((sum, task) => sum + task.days, 0),
        };
        byMember.set(lane.member, [...(byMember.get(lane.member) ?? []), entry]);
      }
    }
    const lanes = new Map(chart.current.lanes.map((lane) => [lane.member, lane]));
    for (const past of history) for (const lane of past.current.lanes) if (!lanes.has(lane.member)) lanes.set(lane.member, { ...lane, tasks: [] });
    return [...lanes.values()].map((lane) => ({
      name: lane.member,
      memberId: lane.memberId,
      allocatedDays: lane.tasks.filter((task) => !isTimeOff(task)).reduce((sum, task) => sum + task.days, 0),
      timeOffDays: lane.tasks.filter(isTimeOff).reduce((sum, task) => sum + task.days, 0),
      focusFactor: focusFactorFromHistory(byMember.get(lane.member) ?? []),
    }));
  }

  async planPreview(sprintId: number, backlog: string) {
    const chart = await this.load(sprintId);
    let items = parseBacklog(backlog);
    let source: "built-in" | "openai" = "built-in";
    if (items.some((item) => item.days === null)) {
      const estimates = await aiEstimates(items);
      if (estimates) {
        items = items.map((item) => ({ ...item, days: item.days ?? estimates.get(item.name) ?? null }));
        source = "openai";
      }
    }
    const members = await this.plannerMembers(chart);
    return { plan: planSprint(items, members, chart.sprint.days), members, source };
  }
}

function builtInWhy(forecast: Forecast) {
  const top = forecast.atRisk[0];
  if (forecast.status === "done") return "Everything planned is done.";
  if (forecast.currentDay === 0) return forecast.status === "late" ? "The plan has more work on one lane than the sprint has days." : "Nothing has started yet, so this is the plan rather than a forecast.";
  if (forecast.scopeAddedDays >= 1 && forecast.daysLate > 0) return `Mostly scope: ${forecast.scopeAddedDays} days of work were added after the sprint started.`;
  if (top) return `Mostly "${top.name}": ${top.reasons.map((r) => r.text.toLowerCase()).join(", ")}.`;
  if (forecast.pace < 0.9) return `The team is at ${Math.round(forecast.pace * 100)}% of the planned pace.`;
  return "Work is landing roughly as planned.";
}

/** Ask OpenAI for estimates of unsized items. Returns null without a key or on any failure. */
async function aiEstimates(items: BacklogItem[]) {
  const unsized = items.filter((item) => item.days === null).map((item) => item.name);
  if (!unsized.length) return null;
  const reply = await complete(
    'Estimate each backlog item in working days for one developer, in quarter-day steps between 0.25 and 10. Reply as JSON: {"estimates":[{"name":"...","days":1.5}]}, using the names exactly as given.',
    JSON.stringify({ sized: items.filter((item) => item.days !== null), unsized }),
    { maxTokens: 400, json: true }
  );
  if (!reply) return null;
  try {
    const parsed = JSON.parse(reply) as { estimates?: { name?: string; days?: number }[] };
    const map = new Map<string, number>();
    for (const estimate of parsed.estimates ?? []) {
      if (estimate.name && typeof estimate.days === "number" && estimate.days > 0) {
        map.set(estimate.name, Math.min(10, Math.max(0.25, Math.round(estimate.days * 4) / 4)));
      }
    }
    return map.size ? map : null;
  } catch {
    return null;
  }
}
