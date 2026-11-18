import { type SyncEvent } from "~/server/integrations/events";
import { UseCase } from "~/server/logic/useCase";
import { parseLinkUrl } from "~/shared/logic/insights/links";
import { State } from "~/shared/types/State";

const OPEN_PR = ["open", "draft", "in_review"];

/** Link a task to a GitHub pull request or issue, or a Jira issue, by URL. */
export class LinkTaskUseCase extends UseCase {
  async add(input: { sprintTaskId: number; url: string; title?: string }) {
    const parsed = parseLinkUrl(input.url);
    if (!parsed) throw new Error("Paste a GitHub pull request or issue URL, or a Jira issue URL.");
    const sprintTask = await this.db.sprintTask.findUnique({ where: { id: input.sprintTaskId }, select: { taskId: true } });
    if (!sprintTask) throw new Error("Task not found");
    if (parsed.provider === "jira") {
      await this.db.task.update({ where: { id: sprintTask.taskId }, data: { jiraIssueKey: parsed.externalId } });
    }
    return this.db.taskLink.upsert({
      where: { taskId_url: { taskId: sprintTask.taskId, url: parsed.url } },
      create: { taskId: sprintTask.taskId, ...parsed, title: input.title ?? null },
      update: { title: input.title ?? undefined },
    });
  }

  async remove(input: { id: number }) {
    await this.db.taskLink.delete({ where: { id: input.id } });
    return { id: input.id };
  }
}

/**
 * Apply a webhook to tasks. Matches tasks that already link the PR or issue, plus live tasks whose
 * Jira key appears in it (and links those for next time). GitHub never re-opens a completed task;
 * Jira is treated as the source of truth for its own issues.
 */
export class ApplySyncEventUseCase extends UseCase {
  async execute(event: SyncEvent, now = new Date()) {
    const linked = await this.db.taskLink.findMany({
      where: {
        provider: event.provider,
        OR: [{ externalId: event.externalId }, ...(event.url ? [{ url: event.url }] : [])],
      },
      select: { id: true, taskId: true },
    });
    const keyed = event.jiraKeys.length
      ? await this.db.task.findMany({ where: { jiraIssueKey: { in: event.jiraKeys }, snapshotId: null }, select: { id: true } })
      : [];

    const taskIds = new Set([...linked.map((link) => link.taskId), ...keyed.map((task) => task.id)]);
    if (taskIds.size === 0) return { matched: 0, updated: 0 };

    await this.db.taskLink.updateMany({
      where: { id: { in: linked.map((link) => link.id) } },
      data: { status: event.linkStatus, lastEventAt: now, ...(event.title ? { title: event.title } : {}) },
    });
    const linkedTaskIds = new Set(linked.map((link) => link.taskId));
    if (event.url) {
      for (const task of keyed) {
        if (linkedTaskIds.has(task.id)) continue;
        await this.db.taskLink.upsert({
          where: { taskId_url: { taskId: task.id, url: event.url } },
          create: {
            taskId: task.id,
            provider: event.provider,
            kind: event.kind,
            externalId: event.externalId,
            url: event.url,
            title: event.title,
            status: event.linkStatus,
            lastEventAt: now,
          },
          update: { status: event.linkStatus, lastEventAt: now },
        });
      }
    }

    let updated = 0;
    if (event.taskState) {
      const tasks = await this.db.task.findMany({ where: { id: { in: [...taskIds] }, snapshotId: null }, select: { id: true, state: true } }).then((rows) => rows.map((row) => ({ ...row, state: row.state as State })));
      for (const task of tasks) {
        if (task.state === event.taskState) continue;
        if (event.provider === "github" && task.state === State.COMPLETED) continue;
        await this.db.task.update({ where: { id: task.id }, data: { state: event.taskState } });
        updated++;
      }
    }
    return { matched: taskIds.size, updated };
  }
}

/** Mark in-progress tasks at risk when their open pull request has gone quiet. */
export class MarkStalePullRequestsUseCase extends UseCase {
  async execute(staleDays: number, now = new Date()) {
    const cutoff = new Date(now.getTime() - staleDays * 86_400_000);
    const stale = await this.db.taskLink.findMany({
      where: { kind: "pull_request", status: { in: OPEN_PR }, lastEventAt: { lt: cutoff } },
      select: { taskId: true },
    });
    if (!stale.length) return 0;
    const result = await this.db.task.updateMany({
      where: { id: { in: stale.map((link) => link.taskId) }, snapshotId: null, state: { in: [State.IN_PROGRESS, State.NOT_STARTED] } },
      data: { state: State.AT_RISK },
    });
    return result.count;
  }
}
