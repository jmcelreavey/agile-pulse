import { State } from "~/shared/types/State";
import { indexTasks, isTimeOff, normaliseHistory, type ChartState } from "~/shared/logic/insights/types";

/** What happened to one task across the sprint's daily snapshots. */
export type TaskHistory = {
  key: string;
  name: string;
  firstSeenDay: number;
  firstEstimate: number;
  latestEstimate: number;
  /** End day in the first snapshot that had the task, and in the latest one. */
  firstEnd: number;
  latestEnd: number;
  /** Days spent in each state, counted once per daily snapshot. */
  daysInState: Record<string, number>;
  /** Times the task went from With QA (or sign-off) back to work. */
  qaBounces: number;
  /** Times the task changed lane. */
  reassignments: number;
  completedOnDay: number | null;
  members: string[];
};

const BACK_TO_WORK: ReadonlySet<string> = new Set([State.IN_PROGRESS, State.AT_RISK, State.BLOCKED, State.NOT_STARTED]);
const REVIEW: ReadonlySet<string> = new Set([State.WITH_QA, State.SIGN_OFF_REQUIRED]);

/**
 * Walk the snapshots in day order (plus the live chart last) and record each task's changes.
 * Leave and distraction blocks are skipped: they are time off, not work.
 */
export function analyseHistory(history: ChartState[], current: ChartState): Map<string, TaskHistory> {
  const states = normaliseHistory([...history.filter((state) => state.day < current.day), current]);
  const result = new Map<string, TaskHistory>();
  let previous: ReturnType<typeof indexTasks> | null = null;

  for (const state of states) {
    const index = indexTasks(state);
    for (const [key, entry] of index) {
      if (isTimeOff(entry.task)) continue;
      let record = result.get(key);
      if (!record) {
        record = {
          key,
          name: entry.task.name,
          firstSeenDay: state.day,
          firstEstimate: entry.task.days,
          latestEstimate: entry.task.days,
          firstEnd: entry.end,
          latestEnd: entry.end,
          daysInState: {},
          qaBounces: 0,
          reassignments: 0,
          completedOnDay: null,
          members: entry.member ? [entry.member] : [],
        };
        result.set(key, record);
      }
      record.name = entry.task.name;
      // Once done, a task's position no longer matters: later shifts aren't slips.
      const doneBefore = record.completedOnDay !== null && entry.task.state === State.COMPLETED;
      if (!doneBefore) {
        record.latestEstimate = entry.task.days;
        record.latestEnd = entry.end;
      }
      if (state.day > 0) {
        record.daysInState[entry.task.state] = (record.daysInState[entry.task.state] ?? 0) + 1;
      }
      const before = previous?.get(key);
      if (before) {
        if (REVIEW.has(before.task.state) && BACK_TO_WORK.has(entry.task.state)) record.qaBounces++;
        if (before.member !== entry.member && entry.member) {
          record.reassignments++;
          if (!record.members.includes(entry.member)) record.members.push(entry.member);
        }
      }
      if (entry.task.state === State.COMPLETED && record.completedOnDay === null) {
        record.completedOnDay = state.day;
      } else if (entry.task.state !== State.COMPLETED) {
        record.completedOnDay = null;
      }
    }
    previous = index;
  }
  return result;
}

/** Total work days on the plan in each state, to spot scope added mid-sprint. */
export function scopeByDay(history: ChartState[], current: ChartState) {
  const states = normaliseHistory([...history.filter((state) => state.day < current.day), current]);
  return states.map((state) => ({
    day: state.day,
    workDays: [...indexTasks(state).values()]
      .filter((entry) => !isTimeOff(entry.task))
      .reduce((sum, entry) => sum + entry.task.days, 0),
  }));
}
