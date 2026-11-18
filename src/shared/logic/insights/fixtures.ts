import { State } from "~/shared/types/State";
import { type ChartState, type ChartTask } from "~/shared/logic/insights/types";

/** Build chart states tersely in tests: lanes are [member, [key, days, state][]]. */
export function chart(day: number, sprintDays: number, lanes: [string, [string, number, string][]][]): ChartState {
  return {
    day,
    sprintDays,
    unassigned: [],
    lanes: lanes.map(([member, tasks]) => ({
      member,
      tasks: tasks.map(([key, days, state]): ChartTask => ({ key, name: key, days, state })),
    })),
  };
}

export const S = State;
