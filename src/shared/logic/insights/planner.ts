import { round1 } from "~/shared/logic/insights/types";

export type BacklogItem = {
  name: string;
  /** Estimate in days, if the line gave one. */
  days: number | null;
  assignee: string | null;
};

export type PlannerMember = {
  name: string;
  memberId?: number;
  /** Work days already on this person's lane in the sprint. */
  allocatedDays: number;
  /** Leave and distraction days on the lane. */
  timeOffDays: number;
  /** Share of planned work this person delivered in recent sprints (1 = all of it). */
  focusFactor: number;
};

export type PlannedTask = {
  name: string;
  days: number;
  estimated: boolean;
  member: string | null;
  memberId?: number;
  reason: string;
};

export type PlannedLane = {
  member: string;
  memberId?: number;
  capacity: number;
  planned: number;
  free: number;
};

export type SprintPlan = {
  tasks: PlannedTask[];
  lanes: PlannedLane[];
  overflow: PlannedTask[];
  defaultEstimate: number;
  summary: string;
};

const SIZES: Record<string, number> = { xs: 0.5, s: 1, m: 2, l: 3, xl: 5 };

/**
 * Read a pasted backlog, one item per line. Understands bullets and numbering, estimates written
 * as "2d", "2 days", "(1.5)", "| 3" or a trailing number, T-shirt sizes in brackets, and "@name".
 */
export function parseBacklog(text: string): BacklogItem[] {
  const items: BacklogItem[] = [];
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.replace(/^\s*(?:[-*•]|\d+[.)]|\[[ x]\])\s*/i, "").trim();
    if (!line || line.startsWith("#")) continue;

    let assignee: string | null = null;
    line = line.replace(/(?:^|\s)@([\p{L}][\p{L}\-']*)/u, (_match, name: string) => {
      assignee = name;
      return " ";
    });

    let days: number | null = null;
    const patterns: RegExp[] = [
      /[([]\s*(\d+(?:\.\d+)?)\s*(?:d|days?)?\s*[)\]]/i,
      /(?:^|\s|[|,:-])\s*(\d+(?:\.\d+)?)\s*(?:d|days?)\b/i,
      /[([]\s*(xs|s|m|l|xl)\s*[)\]]/i,
      /\s[|,:-]\s*(\d+(?:\.\d+)?)\s*$/,
      /\s(\d+(?:\.\d+)?)\s*$/,
    ];
    for (const pattern of patterns) {
      const match = pattern.exec(line);
      if (!match?.[1]) continue;
      const value = match[1].toLowerCase();
      days = SIZES[value] ?? Number(value);
      line = line.slice(0, match.index) + line.slice(match.index + match[0].length);
      break;
    }
    if (days !== null && (!Number.isFinite(days) || days <= 0)) days = null;
    if (days !== null) days = Math.min(24, Math.max(0.25, Math.round(days * 4) / 4));

    const name = line.replace(/\s*[|,:-]\s*$/, "").replace(/\s{2,}/g, " ").trim();
    if (name.length >= 3) items.push({ name, days, assignee });
  }
  return items;
}

/**
 * Lay backlog items onto lanes. Biggest items first, each to the person with the most free
 * capacity, where capacity is sprint days minus leave, scaled by their recent focus factor, minus
 * work already on their lane. Items with "@name" go to that person. Anything that fits nowhere is
 * returned as overflow rather than squeezed in.
 */
export function planSprint(items: BacklogItem[], members: PlannerMember[], sprintDays: number): SprintPlan {
  const known = items.map((item) => item.days).filter((days): days is number => days !== null).sort((a, b) => a - b);
  const defaultEstimate = known.length ? known[Math.floor(known.length / 2)] ?? 1 : 1;

  const lanes = members.map((member) => {
    const focus = Math.min(1.2, Math.max(0.5, member.focusFactor || 1));
    const capacity = round1(Math.max(0, sprintDays - member.timeOffDays) * focus);
    return { member: member.name, memberId: member.memberId, capacity, planned: member.allocatedDays, focus };
  });
  const free = (lane: (typeof lanes)[number]) => round1(lane.capacity - lane.planned);
  const findLane = (name: string) => {
    const wanted = name.toLowerCase();
    return lanes.find((lane) => lane.member.toLowerCase() === wanted) ?? lanes.find((lane) => lane.member.toLowerCase().startsWith(wanted));
  };

  const ordered = items
    .map((item, index) => ({ item, index, days: item.days ?? defaultEstimate }))
    .sort((a, b) => Number(Boolean(b.item.assignee)) - Number(Boolean(a.item.assignee)) || b.days - a.days || a.index - b.index);

  const planned: (PlannedTask & { index: number })[] = [];
  const overflow: PlannedTask[] = [];

  for (const { item, index, days } of ordered) {
    const estimated = item.days === null;
    const pinned = item.assignee ? findLane(item.assignee) : undefined;
    if (pinned) {
      const before = free(pinned);
      pinned.planned += days;
      planned.push({
        index,
        name: item.name,
        days,
        estimated,
        member: pinned.member,
        memberId: pinned.memberId,
        reason: before >= days ? `Asked for ${pinned.member}` : `Asked for ${pinned.member}, who only had ${before} days free`,
      });
      continue;
    }
    const best = [...lanes].sort((a, b) => free(b) - free(a) || a.member.localeCompare(b.member))[0];
    if (!best || free(best) + 0.001 < days) {
      overflow.push({ name: item.name, days, estimated, member: null, reason: best ? `Needs ${days} days; the most anyone has free is ${Math.max(0, free(best))}` : "No one is on this sprint yet" });
      continue;
    }
    const before = free(best);
    best.planned += days;
    planned.push({ index, name: item.name, days, estimated, member: best.member, memberId: best.memberId, reason: `Most free capacity (${before} of ${best.capacity} days)` });
  }

  planned.sort((a, b) => a.index - b.index);
  const placedDays = round1(planned.reduce((sum, task) => sum + task.days, 0));
  const overflowDays = round1(overflow.reduce((sum, task) => sum + task.days, 0));
  const summary =
    `${planned.length} of ${items.length} items placed (${placedDays} days)` +
    (overflow.length ? `; ${overflow.length} left over (${overflowDays} days) because they don't fit` : "") +
    (planned.some((task) => task.estimated) ? `. Items without an estimate were sized at ${defaultEstimate} days, the median of the rest.` : ".");

  return {
    tasks: planned.map(({ index: _index, ...task }) => task),
    lanes: lanes.map((lane) => ({ member: lane.member, memberId: lane.memberId, capacity: lane.capacity, planned: round1(lane.planned), free: free(lane) })),
    overflow,
    defaultEstimate,
    summary,
  };
}

/** Focus factor from past sprints: work completed over work planned, per person. */
export function focusFactorFromHistory(sprints: { planned: number; completed: number }[]): number {
  const planned = sprints.reduce((sum, sprint) => sum + sprint.planned, 0);
  const completed = sprints.reduce((sum, sprint) => sum + sprint.completed, 0);
  if (planned <= 0) return 1;
  return Math.round(Math.min(1.2, Math.max(0.5, completed / planned)) * 100) / 100;
}
