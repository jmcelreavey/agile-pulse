import { z } from "zod";
import { type createCaller } from "~/server/api/root";
import { type DB } from "~/server/db";
import { LoadSprintChartUseCase } from "~/server/logic/insights/LoadSprintChartUseCase";
import { SprintInsightsUseCase, forecastFor } from "~/server/logic/insights/SprintInsightsUseCase";
import { defineTool, type McpTool } from "~/server/mcp/protocol";
import { State } from "~/shared/types/State";

export type McpContext = { db: DB; api: ReturnType<typeof createCaller> };

const tool = <TSchema extends z.ZodType>(definition: McpTool<McpContext, TSchema>) => defineTool(definition);

const sprintId = { sprintId: { type: "integer", description: "Sprint id, from list_sprints" } };
const states = Object.values(State);

/** Tools exposed over MCP. Reads use the insight functions; writes go through the tRPC API. */
export const mcpTools: McpTool<McpContext>[] = [
  tool({
    name: "list_projects",
    title: "List projects",
    description: "List projects with their state and number of sprints.",
    input: z.object({}),
    inputSchema: { type: "object", properties: {} },
    readOnly: true,
    run: async (_input, { db }) => {
      const projects = await db.project.findMany({
        where: { snapshotId: null },
        select: { id: true, name: true, state: true, description: true, _count: { select: { sprints: true } } },
        orderBy: { name: "asc" },
      });
      return { projects: projects.map(({ _count, ...project }) => ({ ...project, sprints: _count.sprints })) };
    },
  }),
  tool({
    name: "list_sprints",
    title: "List sprints",
    description: "List sprints, optionally for one project or in one state (for example \"In Progress\").",
    input: z.object({ projectId: z.number().int().positive().optional(), state: z.enum(State).optional() }),
    inputSchema: {
      type: "object",
      properties: { projectId: { type: "integer" }, state: { type: "string", enum: [State.NOT_STARTED, State.IN_PROGRESS, State.COMPLETED] } },
    },
    readOnly: true,
    run: async ({ projectId, state }, { db }) => ({
      sprints: (
        await db.sprint.findMany({
          where: { snapshotId: null, ...(projectId ? { projectId } : {}), ...(state ? { state } : {}) },
          select: { id: true, reference: true, state: true, days: true, daysRemaining: true, project: { select: { id: true, name: true } } },
          orderBy: [{ projectId: "asc" }, { id: "asc" }],
          take: 100,
        })
      ).map((sprint) => ({ ...sprint, currentDay: sprint.days - sprint.daysRemaining })),
    }),
  }),
  tool({
    name: "get_sprint",
    title: "Get sprint chart",
    description: "The sprint chart: each member's lane with tasks in order (sprintTaskId, name, days, state) and linked PRs or issues.",
    input: z.object({ sprintId: z.number().int().positive() }),
    inputSchema: { type: "object", properties: sprintId, required: ["sprintId"] },
    readOnly: true,
    run: async ({ sprintId }, { db }) => {
      const chart = await new LoadSprintChartUseCase(db).execute({ sprintId, withHistory: false });
      const strip = (task: { key: string; sprintTaskId?: number; name: string; days: number; state: string }) => ({
        sprintTaskId: task.sprintTaskId,
        name: task.name,
        days: task.days,
        state: task.state,
        links: chart.links.filter((link) => link.taskKey === task.key).map(({ externalId, status, url }) => ({ externalId, status, url })),
      });
      return {
        sprint: chart.sprint,
        currentDay: chart.current.day,
        lanes: chart.current.lanes.map((lane) => ({ member: lane.member, memberId: lane.memberId, tasks: lane.tasks.map(strip) })),
        unassigned: chart.current.unassigned.map(strip),
      };
    },
  }),
  tool({
    name: "get_forecast",
    title: "Get sprint forecast",
    description: "Forecast landing day against the sprint's end, pace, per-lane forecast and a one-paragraph summary.",
    input: z.object({ sprintId: z.number().int().positive() }),
    inputSchema: { type: "object", properties: sprintId, required: ["sprintId"] },
    readOnly: true,
    run: async ({ sprintId }, { db }) => {
      const { forecast, eta, sprint } = await new SprintInsightsUseCase(db).forecast(sprintId);
      const { atRisk, ...rest } = forecast;
      return { sprint, ...rest, atRiskCount: atRisk.length, eta };
    },
  }),
  tool({
    name: "list_at_risk_tasks",
    title: "List at-risk tasks",
    description: "Tasks at risk of missing the sprint, with reasons (behind plan, past the end, blocked, QA bounces, slips, stale PRs). Without sprintId, covers every sprint in progress.",
    input: z.object({ sprintId: z.number().int().positive().optional() }),
    inputSchema: { type: "object", properties: sprintId },
    readOnly: true,
    run: async ({ sprintId }, { db }) => {
      const ids = sprintId
        ? [sprintId]
        : (await db.sprint.findMany({ where: { state: State.IN_PROGRESS, snapshotId: null }, select: { id: true }, take: 20 })).map((s) => s.id);
      const results = [];
      for (const id of ids) {
        const chart = await new LoadSprintChartUseCase(db).execute({ sprintId: id });
        const forecast = forecastFor(chart);
        results.push({ sprintId: id, project: chart.sprint.projectName, sprint: chart.sprint.reference, status: forecast.status, atRisk: forecast.atRisk });
      }
      return { sprints: results };
    },
  }),
  tool({
    name: "get_standup",
    title: "Get standup digest",
    description: "Yesterday's moves, today's focus per person, and blockers for a sprint.",
    input: z.object({ sprintId: z.number().int().positive() }),
    inputSchema: { type: "object", properties: sprintId, required: ["sprintId"] },
    readOnly: true,
    run: async ({ sprintId }, { db }) => (await new SprintInsightsUseCase(db).standup(sprintId)).standup,
  }),
  tool({
    name: "update_task",
    title: "Update a task",
    description: "Change a task's state, estimate (days, in quarter days) or name.",
    input: z.object({
      sprintTaskId: z.number().int().positive(),
      state: z.enum(State).optional(),
      days: z.number().min(0.25).max(24).multipleOf(0.25).optional(),
      name: z.string().min(3).max(200).optional(),
    }),
    inputSchema: {
      type: "object",
      properties: {
        sprintTaskId: { type: "integer" },
        state: { type: "string", enum: states },
        days: { type: "number", minimum: 0.25, maximum: 24, multipleOf: 0.25 },
        name: { type: "string", minLength: 3 },
      },
      required: ["sprintTaskId"],
    },
    readOnly: false,
    run: async ({ sprintTaskId, state, days, name }, { db, api }) => {
      const row = await db.sprintTask.findUnique({
        where: { id: sprintTaskId },
        select: { sprintId: true, days: true, task: { select: { name: true, state: true, description: true } }, sprintMember: { select: { member: { select: { id: true, name: true } } } } },
      });
      if (!row) throw new Error("Task not found");
      await api.sprint.updateTask({
        id: sprintTaskId,
        sprintId: row.sprintId,
        days: days ?? row.days,
        state: state ?? (row.task.state as State),
        name: name ?? row.task.name,
        description: row.task.description ?? undefined,
        memberId: row.sprintMember?.member.id,
        memberName: row.sprintMember?.member.name,
      });
      return { ok: true, sprintTaskId };
    },
  }),
  tool({
    name: "move_task",
    title: "Move a task",
    description: "Move a task to a member's lane (by name, as shown in get_sprint), optionally at a 0-based position. Omit position to put it last.",
    input: z.object({ sprintTaskId: z.number().int().positive(), member: z.string().min(1), position: z.number().int().min(0).optional() }),
    inputSchema: {
      type: "object",
      properties: { sprintTaskId: { type: "integer" }, member: { type: "string" }, position: { type: "integer", minimum: 0 } },
      required: ["sprintTaskId", "member"],
    },
    readOnly: false,
    run: async ({ sprintTaskId, member, position }, { db, api }) => {
      const row = await db.sprintTask.findUnique({ where: { id: sprintTaskId }, select: { sprintId: true } });
      if (!row) throw new Error("Task not found");
      const lanes = await db.sprintMember.findMany({
        where: { sprintId: row.sprintId },
        select: { id: true, member: { select: { name: true } }, _count: { select: { sprintTasks: true } } },
      });
      const lane = lanes.find((l) => l.member.name.toLowerCase() === member.toLowerCase()) ?? lanes.find((l) => l.member.name.toLowerCase().startsWith(member.toLowerCase()));
      if (!lane) throw new Error(`No lane for "${member}". Lanes: ${lanes.map((l) => l.member.name).join(", ")}`);
      await api.sprint.updateSprintTaskOrder({ sprintId: row.sprintId, sprintTaskId, sprintMemberId: lane.id, order: position ?? lane._count.sprintTasks });
      return { ok: true, sprintTaskId, member: lane.member.name };
    },
  }),
  tool({
    name: "add_task",
    title: "Add a task",
    description: "Add a task to the end of a member's lane. Creates the member if the name is new.",
    input: z.object({ sprintId: z.number().int().positive(), name: z.string().min(3).max(200), days: z.number().min(0.25).max(24).multipleOf(0.25), member: z.string().min(3) }),
    inputSchema: {
      type: "object",
      properties: { ...sprintId, name: { type: "string", minLength: 3 }, days: { type: "number", minimum: 0.25, maximum: 24, multipleOf: 0.25 }, member: { type: "string", minLength: 3 } },
      required: ["sprintId", "name", "days", "member"],
    },
    readOnly: false,
    run: async ({ sprintId, name, days, member }, { db, api }) => {
      const existing = await db.sprintMember.findMany({ where: { sprintId }, select: { member: { select: { id: true, name: true } } } });
      const match = existing.find((lane) => lane.member.name.toLowerCase() === member.toLowerCase());
      const created = await api.sprint.createTask({
        sprintId,
        name,
        days,
        ...(match ? { memberId: match.member.id } : { memberName: member }),
      });
      return { ok: true, sprintTaskId: created.id };
    },
  }),
];
