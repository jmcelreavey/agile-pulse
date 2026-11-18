import { State } from "~/shared/types/State";
import { analyseHistory, scopeByDay } from "~/shared/logic/insights/history";
import { formatDays, plural, round1, type ChartState } from "~/shared/logic/insights/types";

export type RetroCategory = "slip" | "qa" | "blocker" | "scope" | "handoff" | "win";

export type RetroPrompt = {
  category: RetroCategory;
  /** What the snapshots show, stated as fact. */
  evidence: string;
  /** An open question for the team to discuss. */
  question: string;
  taskKey?: string;
};

export type Retro = {
  wentWell: RetroPrompt[];
  toDiscuss: RetroPrompt[];
  stats: { tasks: number; completed: number; slipped: number; qaBounces: number; blockedDays: number; scopeAddedDays: number };
};

/**
 * Turn the sprint's replay into retro prompts. Every prompt quotes the evidence from the snapshots
 * and ends in a question, so the retro starts from what happened rather than from memory.
 */
export function generateRetro(history: ChartState[], current: ChartState, limit = 8): Retro {
  const tasks = [...analyseHistory(history, current).values()];
  const scope = scopeByDay(history, current);
  const scopeAddedDays = scope.length > 1 ? round1((scope.at(-1)?.workDays ?? 0) - (scope[0]?.workDays ?? 0)) : 0;
  const startDay = scope[0]?.day ?? 0;
  const toDiscuss: (RetroPrompt & { weight: number })[] = [];
  const wentWell: RetroPrompt[] = [];

  for (const task of tasks) {
    const slipped = round1(task.latestEnd - task.firstEnd);
    const grew = round1(task.latestEstimate - task.firstEstimate);
    const blockedDays = task.daysInState[State.BLOCKED] ?? 0;
    const evidence: string[] = [];
    if (slipped >= 1) evidence.push(`slipped ${formatDays(slipped)}`);
    if (grew >= 0.5) evidence.push(`grew from ${formatDays(task.firstEstimate)} to ${formatDays(task.latestEstimate)}`);
    if (task.qaBounces > 0) evidence.push(`came back from QA ${plural(task.qaBounces, "time")}`);
    if (blockedDays > 0) evidence.push(`was blocked for ${formatDays(blockedDays)}`);

    if (evidence.length > 0) {
      const category: RetroCategory =
        task.qaBounces > 0 ? "qa" : blockedDays > 0 ? "blocker" : "slip";
      const question =
        category === "qa"
          ? "What did QA find that we could have caught before handing it over?"
          : category === "blocker"
            ? "Who could have unblocked this sooner, and how would we have known?"
            : grew >= 0.5
              ? "What did we learn about this work that we didn't know when we sized it?"
              : "What pushed this back, and would a smaller first slice have helped?";
      toDiscuss.push({
        category,
        evidence: `"${task.name}" ${joinList(evidence)}.`,
        question,
        taskKey: task.key,
        weight: slipped + grew + task.qaBounces * 2 + blockedDays,
      });
    }

    if (task.reassignments > 0) {
      toDiscuss.push({
        category: "handoff",
        evidence: `"${task.name}" changed hands ${plural(task.reassignments, "time")} (${task.members.join(" to ")}).`,
        question: "Was the handover planned, and did the context travel with it?",
        taskKey: task.key,
        weight: task.reassignments,
      });
    }

    if (task.firstSeenDay > startDay) {
      toDiscuss.push({
        category: "scope",
        evidence: `"${task.name}" (${formatDays(task.latestEstimate)}) was added on day ${task.firstSeenDay}.`,
        question: "Did this need to come into the sprint, and what did it push out?",
        taskKey: task.key,
        weight: task.latestEstimate / 2,
      });
    }

    if (task.completedOnDay !== null && task.completedOnDay > 0 && task.completedOnDay <= Math.floor(task.firstEnd) && slipped < 1 && task.qaBounces === 0) {
      wentWell.push({
        category: "win",
        evidence: `"${task.name}" was done on day ${task.completedOnDay}, on or ahead of plan (day ${round1(task.firstEnd)}).`,
        question: "What made this one go smoothly, and can we repeat it?",
        taskKey: task.key,
      });
    }
  }

  if (scopeAddedDays >= 1) {
    toDiscuss.push({
      category: "scope",
      evidence: `In total ${formatDays(scopeAddedDays)} of work were added after the sprint started.`,
      question: "How do we decide what is allowed into a sprint once it has started?",
      weight: scopeAddedDays,
    });
  }

  toDiscuss.sort((a, b) => b.weight - a.weight);
  const completed = tasks.filter((task) => task.completedOnDay !== null).length;

  return {
    wentWell: wentWell.slice(0, Math.max(2, Math.floor(limit / 2))),
    toDiscuss: toDiscuss.slice(0, limit).map(({ weight: _weight, ...prompt }) => prompt),
    stats: {
      tasks: tasks.length,
      completed,
      slipped: tasks.filter((task) => task.latestEnd - task.firstEnd >= 1).length,
      qaBounces: tasks.reduce((sum, task) => sum + task.qaBounces, 0),
      blockedDays: tasks.reduce((sum, task) => sum + (task.daysInState[State.BLOCKED] ?? 0), 0),
      scopeAddedDays,
    },
  };
}

function joinList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}
