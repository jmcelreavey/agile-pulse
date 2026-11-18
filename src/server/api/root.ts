import { changelogRouter } from "~/server/api/routers/changelog";
import { customerRouter } from "~/server/api/routers/customer";
import { deadlineRouter } from "~/server/api/routers/deadline";
import { deletedRouter } from "~/server/api/routers/deleted";
import { jiraRouter } from "~/server/api/routers/jira";
import { memberRouter } from "~/server/api/routers/member";
import { projectRouter } from "~/server/api/routers/project";
import { snapshotRouter } from "~/server/api/routers/snapshot";
import { sprintRouter } from "~/server/api/routers/sprint";
import { taskRouter } from "~/server/api/routers/task";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  project: projectRouter,
  sprint: sprintRouter,
  task: taskRouter,
  member: memberRouter,
  deleted: deletedRouter,
  deadline: deadlineRouter,
  snapshot: snapshotRouter,
  jira: jiraRouter,
  customer: customerRouter,
  changelog: changelogRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
