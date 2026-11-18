import { State } from "~/shared/types/State";
import { analyseHistory, scopeByDay } from "~/shared/logic/insights/history";
import {
  creditFor,
  formatDays,
  isTimeOff,
  laneTimeline,
  plural,
  round1,
  type ChartState,
  type TaskLinkInfo,
} from "~/shared/logic/insights/types";

export type ForecastStatus = "not-started" | "on-track" | "at-risk" | "late" | "done";

export type RiskReason = { code: string; text: string };

export type AtRiskTask = {
  key: string;
  sprintTaskId?: number;
  name: string;
  member: string | null;
  state: string;
  severity: "high" | "medium";
  projectedEnd: number | null;
  reasons: RiskReason[];
};

export type LaneForecast = {
  member: string;
  plannedEnd: number;
  forecastEnd: number;
  remainingWork: number;
  pace: number;
};

export type Forecast = {
  currentDay: number;
  sprintDays: number;
  plannedEnd: number;
  forecastEnd: number;
  /** Positive when the forecast lands after the sprint's last day. */
  daysLate: number;
  pace: number;
  status: ForecastStatus;
  scopeAddedDays: number;
  lanes: LaneForecast[];
  atRisk: AtRiskTask[];
  summary: string;
};

export type ForecastOptions = {
  history?: ChartState[];
  links?: TaskLinkInfo[];
  now?: Date;
  /** An open pull request with no activity for this many days counts as stale. */
  stalePrDays?: number;
};

const MIN_PACE = 0.4;
const MAX_PACE = 1.6;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const DAY_MS = 86_400_000;

/**
 * Predict when the sprint lands from the live chart and its daily snapshots.
 *
 * Each lane gets a pace: work earned so far (task estimate x state credit) divided by the work the
 * plan says should be done by now. Remaining work is divided by that pace and added to today, then
 * leave still to come is added on top. The sprint lands when its slowest lane does.
 */
export function computeForecast(current: ChartState, options: ForecastOptions = {}): Forecast {
  const { history = [], links = [], now = new Date(), stalePrDays = 3 } = options;
  const today = clamp(current.day, 0, Number.POSITIVE_INFINITY);
  const taskHistory = analyseHistory(history, current);
  const scope = scopeByDay(history, current);
  const scopeAddedDays = scope.length > 1 ? round1((scope.at(-1)?.workDays ?? 0) - (scope[0]?.workDays ?? 0)) : 0;

  const risks = new Map<string, AtRiskTask>();
  const addRisk = (
    base: Omit<AtRiskTask, "reasons" | "severity" | "projectedEnd">,
    reason: RiskReason,
    severity: AtRiskTask["severity"],
    projectedEnd: number | null = null
  ) => {
    const existing = risks.get(base.key);
    if (existing) {
      if (!existing.reasons.some((r) => r.code === reason.code)) existing.reasons.push(reason);
      if (severity === "high") existing.severity = "high";
      existing.projectedEnd ??= projectedEnd;
      return;
    }
    risks.set(base.key, { ...base, reasons: [reason], severity, projectedEnd });
  };

  let totalEarned = 0;
  let totalPlannedByNow = 0;
  let allWork = 0;
  let allDone = true;

  const lanes: LaneForecast[] = current.lanes.map((lane) => {
    const blocks = laneTimeline(lane);
    const plannedEnd = blocks.at(-1)?.end ?? 0;
    let earned = 0;
    let plannedByNow = 0;
    let remainingWork = 0;
    let timeOffAhead = 0;
    for (const { task, start, end } of blocks) {
      if (isTimeOff(task)) {
        timeOffAhead += Math.max(0, end - Math.max(start, today));
        continue;
      }
      allWork += task.days;
      if (task.state !== State.COMPLETED) allDone = false;
      const credit = creditFor(task.state);
      earned += task.days * credit;
      remainingWork += task.days * (1 - credit);
      plannedByNow += Math.max(0, Math.min(end, today) - start);
    }
    totalEarned += earned;
    totalPlannedByNow += plannedByNow;
    const pace = plannedByNow >= 0.5 ? clamp(earned / plannedByNow, MIN_PACE, MAX_PACE) : 1;
    const forecastEnd = today === 0 ? plannedEnd : today + remainingWork / pace + timeOffAhead;

    // Walk the lane again to project each unfinished task's end at this pace.
    let cursor = today;
    for (const { task, start, end } of blocks) {
      if (isTimeOff(task)) {
        cursor += Math.max(0, end - Math.max(start, today));
        continue;
      }
      if (task.state === State.COMPLETED) continue;
      cursor += today === 0 ? task.days : (task.days * (1 - creditFor(task.state))) / pace;
      const projectedEnd = round1(today === 0 ? end : cursor);
      const base = { key: task.key, sprintTaskId: task.sprintTaskId, name: task.name, member: lane.member, state: task.state };
      if (projectedEnd > current.sprintDays + 0.01) {
        addRisk(
          base,
          {
            code: "past-end",
            text: `Projected to finish on day ${projectedEnd}, after the sprint ends on day ${current.sprintDays}`,
          },
          "high",
          projectedEnd
        );
      }
      const behindBy = today - end;
      if (today > 0 && behindBy >= 0.5 && creditFor(task.state) < 0.8) {
        addRisk(
          base,
          { code: "behind-plan", text: `Planned to be done by day ${round1(end)} but is still ${task.state.toLowerCase()}` },
          behindBy >= 1 ? "high" : "medium",
          projectedEnd
        );
      }
      if (task.state === State.BLOCKED) addRisk(base, { code: "blocked", text: "Blocked" }, "high", projectedEnd);
      if (task.state === State.AT_RISK) addRisk(base, { code: "flagged", text: "Marked at risk by the team" }, "medium", projectedEnd);

      const record = taskHistory.get(task.key);
      if (record) {
        const grew = round1(record.latestEstimate - record.firstEstimate);
        if (grew >= 0.5) {
          addRisk(base, { code: "estimate-grew", text: `Estimate grew from ${formatDays(record.firstEstimate)} to ${formatDays(record.latestEstimate)}` }, "medium", projectedEnd);
        }
        const slipped = round1(record.latestEnd - record.firstEnd);
        if (slipped >= 1 && grew < slipped) {
          addRisk(base, { code: "slipped", text: `Slipped ${formatDays(slipped)} since day ${record.firstSeenDay}` }, "medium", projectedEnd);
        }
        if (record.qaBounces > 0) {
          addRisk(base, { code: "qa-bounce", text: `Came back from QA ${plural(record.qaBounces, "time")}` }, record.qaBounces > 1 ? "high" : "medium", projectedEnd);
        }
        const blockedDays = record.daysInState[State.BLOCKED] ?? 0;
        if (blockedDays >= 2 && task.state !== State.BLOCKED) {
          addRisk(base, { code: "was-blocked", text: `Was blocked for ${formatDays(blockedDays)}` }, "medium", projectedEnd);
        }
      }
      for (const link of links.filter((l) => l.taskKey === task.key && l.kind === "pull_request")) {
        if (link.status !== "open" && link.status !== "draft" && link.status !== "in_review") continue;
        const idleDays = Math.floor((now.getTime() - link.lastEventAt.getTime()) / DAY_MS);
        if (idleDays >= stalePrDays) {
          addRisk(base, { code: "stale-pr", text: `Pull request ${link.externalId} has had no activity for ${formatDays(idleDays)}` }, "medium", projectedEnd);
        }
      }
    }

    return { member: lane.member, plannedEnd: round1(plannedEnd), forecastEnd: round1(forecastEnd), remainingWork: round1(remainingWork), pace: round1(pace * 100) / 100 };
  });

  const plannedEnd = round1(Math.max(0, ...lanes.map((lane) => lane.plannedEnd)));
  const forecastEnd = round1(Math.max(0, ...lanes.map((lane) => lane.forecastEnd)));
  const pace = totalPlannedByNow >= 0.5 ? Math.round(clamp(totalEarned / totalPlannedByNow, MIN_PACE, MAX_PACE) * 100) / 100 : 1;
  const daysLate = round1(forecastEnd - current.sprintDays);
  const atRisk = [...risks.values()].sort(
    (a, b) => (a.severity === b.severity ? b.reasons.length - a.reasons.length : a.severity === "high" ? -1 : 1)
  );

  let status: ForecastStatus;
  if (allWork > 0 && allDone) status = "done";
  else if (today === 0) status = plannedEnd > current.sprintDays ? "late" : "not-started";
  else if (daysLate > 0.25) status = "late";
  else if (daysLate > -0.5 || atRisk.some((task) => task.severity === "high")) status = "at-risk";
  else status = "on-track";

  return {
    currentDay: today,
    sprintDays: current.sprintDays,
    plannedEnd,
    forecastEnd,
    daysLate,
    pace,
    status,
    scopeAddedDays,
    lanes,
    atRisk,
    summary: summarise({ status, forecastEnd, daysLate, sprintDays: current.sprintDays, atRisk, pace, today, scopeAddedDays }),
  };
}

function summarise(input: {
  status: ForecastStatus;
  forecastEnd: number;
  daysLate: number;
  sprintDays: number;
  atRisk: AtRiskTask[];
  pace: number;
  today: number;
  scopeAddedDays: number;
}) {
  const { status, forecastEnd, daysLate, sprintDays, atRisk, pace, today, scopeAddedDays } = input;
  if (status === "done") return "Every task is done.";
  const parts: string[] = [];
  if (today === 0) {
    parts.push(
      forecastEnd > sprintDays
        ? `The plan already runs to day ${forecastEnd} of ${sprintDays}.`
        : `The plan fits: the busiest lane ends on day ${forecastEnd} of ${sprintDays}.`
    );
  } else if (daysLate > 0.25) {
    parts.push(`Forecast to land on day ${forecastEnd} of ${sprintDays}, ${formatDays(daysLate)} late.`);
  } else {
    parts.push(`Forecast to land on day ${forecastEnd} of ${sprintDays}${daysLate < -0.25 ? `, ${formatDays(-daysLate)} early` : ""}.`);
  }
  if (today > 0) parts.push(`The team is working at ${Math.round(pace * 100)}% of the planned pace.`);
  if (scopeAddedDays >= 0.5) parts.push(`${formatDays(scopeAddedDays)} of work were added after the sprint started.`);
  const top = atRisk[0];
  if (top) {
    parts.push(`${plural(atRisk.length, "task")} at risk; the biggest is "${top.name}" (${top.reasons[0]?.text.toLowerCase()}).`);
  }
  return parts.join(" ");
}
