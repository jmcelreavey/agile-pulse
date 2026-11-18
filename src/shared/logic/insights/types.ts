import { State } from "~/shared/types/State";

/** One block on a lane, as it stood at a point in time. `key` stays the same across snapshots. */
export type ChartTask = {
  key: string;
  /** Live sprint task id, when the task still exists. */
  sprintTaskId?: number;
  name: string;
  days: number;
  state: State;
};

export type ChartLane = { member: string; memberId?: number; tasks: ChartTask[] };

/** The sprint chart at the end of one sprint day. Day 0 is the plan when the sprint started. */
export type ChartState = {
  day: number;
  sprintDays: number;
  lanes: ChartLane[];
  unassigned: ChartTask[];
};

export type LinkStatus = "open" | "draft" | "in_review" | "merged" | "closed" | "done";

export type TaskLinkInfo = {
  taskKey: string;
  provider: "github" | "jira";
  kind: "pull_request" | "issue";
  externalId: string;
  url: string;
  title?: string | null;
  status: LinkStatus;
  lastEventAt: Date;
};

/** Leave and distraction blocks take time on a lane but are not work to deliver. */
export const TIME_OFF_STATES: ReadonlySet<string> = new Set([State.LEAVE, State.DISTRACTION]);

export const isTimeOff = (task: { state: string }) => TIME_OFF_STATES.has(task.state);

/**
 * How much of a task's estimate counts as done in each state. The chart has no "% complete", so
 * the state is the only signal; these weights are deliberately simple and documented.
 */
export const STATE_CREDIT: Readonly<Record<string, number>> = {
  [State.COMPLETED]: 1,
  [State.SIGN_OFF_REQUIRED]: 0.9,
  [State.WITH_QA]: 0.8,
  [State.IN_PROGRESS]: 0.4,
  [State.AT_RISK]: 0.3,
  [State.BLOCKED]: 0.2,
  [State.NOT_STARTED]: 0,
};

export const creditFor = (state: string) => STATE_CREDIT[state] ?? 0;

export const round1 = (value: number) => Math.round(value * 10) / 10;

export const plural = (count: number, word: string, many = `${word}s`) =>
  `${count} ${count === 1 ? word : many}`;

/** "once", "twice", "3 times". */
export const times = (count: number) => (count === 1 ? "once" : count === 2 ? "twice" : `${count} times`);

export const formatDays = (days: number) => plural(round1(days), "day");

/** Start and end (in sprint days) of every block on a lane, in lane order. */
export function laneTimeline(lane: ChartLane) {
  let cursor = 0;
  return lane.tasks.map((task) => {
    const start = cursor;
    cursor += task.days;
    return { task, start, end: cursor };
  });
}

/** Every task in a chart state, keyed by task key. */
export function indexTasks(state: ChartState) {
  const index = new Map<string, { task: ChartTask; member: string | null; start: number; end: number }>();
  for (const lane of state.lanes) {
    for (const block of laneTimeline(lane)) {
      index.set(block.task.key, { task: block.task, member: lane.member, start: block.start, end: block.end });
    }
  }
  for (const task of state.unassigned) {
    if (!index.has(task.key)) index.set(task.key, { task, member: null, start: 0, end: task.days });
  }
  return index;
}

/** Keep the last snapshot of each day, sorted by day. */
export function normaliseHistory(history: ChartState[]) {
  const byDay = new Map<number, ChartState>();
  for (const state of history) byDay.set(state.day, state);
  return [...byDay.values()].sort((a, b) => a.day - b.day);
}
