import { State } from "~/shared/types/State";
import { type Forecast } from "~/shared/logic/insights/forecast";
import { indexTasks, isTimeOff, laneTimeline, type ChartState } from "~/shared/logic/insights/types";

export type StandupMove = { task: string; member: string | null; from: string | null; to: string };

export type Standup = {
  day: number;
  sprintDays: number;
  sinceDay: number | null;
  moves: StandupMove[];
  completed: StandupMove[];
  added: { task: string; member: string | null; days: number }[];
  reassigned: { task: string; from: string | null; to: string | null }[];
  today: { member: string; focus: string | null; state: string | null; next: string | null; away: boolean }[];
  blockers: { task: string; member: string | null; reason: string }[];
  headline: string;
};

/**
 * The daily standup digest: what changed since the previous snapshot, what each person is on
 * today, and anything blocked or at risk. Plain data, so it can render in the app, Slack or email.
 */
export function buildStandup(previous: ChartState | null, current: ChartState, forecast?: Forecast): Standup {
  const before = previous ? indexTasks(previous) : new Map<string, never>();
  const now = indexTasks(current);
  const moves: StandupMove[] = [];
  const completed: StandupMove[] = [];
  const added: Standup["added"] = [];
  const reassigned: Standup["reassigned"] = [];

  for (const [key, entry] of now) {
    if (isTimeOff(entry.task)) continue;
    const old = before.get(key);
    if (!old) {
      if (previous) added.push({ task: entry.task.name, member: entry.member, days: entry.task.days });
      continue;
    }
    if (old.task.state !== entry.task.state) {
      const move = { task: entry.task.name, member: entry.member, from: old.task.state, to: entry.task.state };
      (entry.task.state === State.COMPLETED ? completed : moves).push(move);
    }
    if (old.member !== entry.member) reassigned.push({ task: entry.task.name, from: old.member, to: entry.member });
  }

  const today = current.lanes.map((lane) => {
    const blocks = laneTimeline(lane);
    const onNow = blocks.find((block) => block.start <= current.day && block.end > current.day);
    const away = Boolean(onNow && isTimeOff(onNow.task));
    const open = blocks.filter((block) => !isTimeOff(block.task) && block.task.state !== State.COMPLETED);
    const focus = open.find((block) => block.task.state !== State.NOT_STARTED) ?? open[0];
    const next = open.find((block) => block !== focus);
    return {
      member: lane.member,
      focus: focus?.task.name ?? null,
      state: focus?.task.state ?? null,
      next: next?.task.name ?? null,
      away,
    };
  });

  const blockers: Standup["blockers"] = [];
  for (const entry of now.values()) {
    if (entry.task.state === State.BLOCKED) blockers.push({ task: entry.task.name, member: entry.member, reason: "Blocked" });
  }
  for (const risk of forecast?.atRisk ?? []) {
    if (risk.severity !== "high" || blockers.some((b) => b.task === risk.name)) continue;
    blockers.push({ task: risk.name, member: risk.member, reason: risk.reasons[0]?.text ?? "At risk" });
  }

  const headline = forecast
    ? forecast.summary
    : `Day ${current.day} of ${current.sprintDays}.`;

  return {
    day: current.day,
    sprintDays: current.sprintDays,
    sinceDay: previous?.day ?? null,
    moves,
    completed,
    added,
    reassigned,
    today,
    blockers,
    headline,
  };
}

/** Markdown-ish plain text, used for Slack and the email text part. */
export function standupToText(standup: Standup, title: string): string {
  const lines = [`*${title}: day ${standup.day} of ${standup.sprintDays}*`, standup.headline, ""];
  const since = standup.sinceDay === null ? "Since the sprint started" : `Since day ${standup.sinceDay}`;
  const changes = [
    ...standup.completed.map((m) => `• Done: ${m.task}${m.member ? ` (${m.member})` : ""}`),
    ...standup.moves.map((m) => `• ${m.task}: ${m.from ?? "new"} → ${m.to}${m.member ? ` (${m.member})` : ""}`),
    ...standup.added.map((a) => `• Added: ${a.task} (${a.days}d${a.member ? `, ${a.member}` : ""})`),
    ...standup.reassigned.map((r) => `• ${r.task} moved from ${r.from ?? "unassigned"} to ${r.to ?? "unassigned"}`),
  ];
  lines.push(`*${since}*`, ...(changes.length ? changes : ["• No changes"]), "");
  lines.push("*Today*");
  for (const person of standup.today) {
    if (person.away) lines.push(`• ${person.member}: away`);
    else lines.push(`• ${person.member}: ${person.focus ?? "nothing open"}${person.next ? ` (next: ${person.next})` : ""}`);
  }
  lines.push("", "*Blockers and risks*");
  lines.push(...(standup.blockers.length ? standup.blockers.map((b) => `• ${b.task}${b.member ? ` (${b.member})` : ""}: ${b.reason}`) : ["• None"]));
  return lines.join("\n");
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Simple HTML for the email digest. */
export function standupToHtml(standup: Standup, title: string): string {
  return standupToText(standup, title)
    .split("\n")
    .map((line) => {
      const safe = escapeHtml(line);
      if (/^\*.*\*$/.test(line)) return `<h3 style="margin:16px 0 4px">${safe.slice(1, -1)}</h3>`;
      if (line.startsWith("• ")) return `<div style="margin-left:8px">${safe}</div>`;
      return safe ? `<p style="margin:4px 0">${safe}</p>` : "";
    })
    .join("\n");
}
