import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { type ChartState, type ChartTask, type LinkStatus, type TaskLinkInfo } from "~/shared/logic/insights/types";
import { SprintSnapShotSource } from "~/shared/types/SnapshotSource";
import { State } from "~/shared/types/State";

const laneInclude = {
  orderBy: { order: "asc" as const },
  include: {
    member: true,
    sprintTasks: { orderBy: { order: "asc" as const }, include: { task: true } },
  },
};

type SprintWithLanes = {
  days: number;
  daysRemaining: number;
  state: string;
  sprintMembers: { id: number; member: { id: number; name: string }; sprintTasks: SprintTaskRow[] }[];
  sprintTasks: SprintTaskRow[];
};
type SprintTaskRow = { id: number; days: number; task: { id: number; name: string; state: string; originTaskId: number | null } };

export const liveTaskKey = (taskId: number) => `t${taskId}`;

export function currentDayOf(sprint: { days: number; daysRemaining: number; state: string }) {
  if (sprint.state === String(State.NOT_STARTED)) return 0;
  return Math.max(0, sprint.days - sprint.daysRemaining);
}

/**
 * Loads a sprint's live chart, its daily snapshots and linked work in the shape the insight
 * functions expect. Snapshot tasks are matched to live tasks by `originTaskId`, falling back to
 * the task name for snapshots taken before that column existed.
 */
export class LoadSprintChartUseCase extends UseCase {
  async execute(input: { sprintId: number; withHistory?: boolean }) {
    const sprint = await this.db.sprint.findUnique({
      where: { id: input.sprintId },
      include: {
        project: { select: { id: true, name: true, description: true } },
        sprintMembers: laneInclude,
        sprintTasks: { where: { sprintMemberId: null }, orderBy: { order: "asc" }, include: { task: true } },
      },
    });
    if (!sprint || sprint.snapshotId !== null) throw new RecordNotFoundError("Sprint not found");

    const keyByName = new Map<string, string>();
    const toLiveTask = (row: SprintTaskRow): ChartTask => {
      const key = liveTaskKey(row.task.id);
      keyByName.set(row.task.name.toLowerCase(), key);
      return { key, sprintTaskId: row.id, name: row.task.name, days: row.days, state: row.task.state as State };
    };
    const current = this.toChart(sprint, toLiveTask);

    const taskIds = [...sprint.sprintMembers.flatMap((lane) => lane.sprintTasks), ...sprint.sprintTasks].map((row) => row.task.id);
    const linkRows = taskIds.length
      ? await this.db.taskLink.findMany({ where: { taskId: { in: taskIds } }, orderBy: { createdAt: "asc" } })
      : [];
    const links: (TaskLinkInfo & { id: number; taskId: number })[] = linkRows.map((link) => ({
      id: link.id,
      taskId: link.taskId,
      taskKey: liveTaskKey(link.taskId),
      provider: link.provider === "jira" ? "jira" : "github",
      kind: link.kind === "issue" ? "issue" : "pull_request",
      externalId: link.externalId,
      url: link.url,
      title: link.title,
      status: link.status as LinkStatus,
      lastEventAt: link.lastEventAt,
    }));

    let history: ChartState[] = [];
    if (input.withHistory !== false) {
      const snapshots = await this.db.snapshot.findMany({
        where: { sourceId: sprint.id, source: { in: Object.values(SprintSnapShotSource) } },
        orderBy: { createdAt: "asc" },
        include: {
          sprints: {
            include: {
              sprintMembers: laneInclude,
              sprintTasks: { where: { sprintMemberId: null }, orderBy: { order: "asc" }, include: { task: true } },
            },
          },
        },
      });
      const toSnapshotTask = (row: SprintTaskRow): ChartTask => ({
        key: row.task.originTaskId
          ? liveTaskKey(row.task.originTaskId)
          : (keyByName.get(row.task.name.toLowerCase()) ?? `n:${row.task.name.toLowerCase()}`),
        name: row.task.name,
        days: row.days,
        state: row.task.state as State,
      });
      history = snapshots
        .map((snapshot) => snapshot.sprints[0])
        .filter((copy): copy is NonNullable<typeof copy> => Boolean(copy))
        .map((copy) => this.toChart(copy as SprintWithLanes, toSnapshotTask));
    }

    return {
      sprint: {
        id: sprint.id,
        reference: sprint.reference,
        state: sprint.state,
        days: sprint.days,
        daysRemaining: sprint.daysRemaining,
        startedAt: sprint.startedAt,
        completedAt: sprint.completedAt,
        projectId: sprint.projectId,
        projectName: sprint.project.name,
        projectDescription: sprint.project.description,
      },
      current,
      history,
      links,
    };
  }

  private toChart(sprint: SprintWithLanes, toTask: (row: SprintTaskRow) => ChartTask): ChartState {
    return {
      day: currentDayOf(sprint),
      sprintDays: sprint.days,
      lanes: sprint.sprintMembers.map((lane) => ({
        member: lane.member.name,
        memberId: lane.member.id,
        tasks: lane.sprintTasks.map(toTask),
      })),
      unassigned: sprint.sprintTasks.map(toTask),
    };
  }
}

export type SprintChart = getReturnType<LoadSprintChartUseCase>;
