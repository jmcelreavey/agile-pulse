/**
 * Soft delete support.
 *
 * Archived rows keep a `deletedRecordId` that points at the DeleteRecord which archived them.
 * Every read against a soft-deletable model (and every to-many include of one) is filtered to
 * live rows unless the query already filters on `deletedRecordId` explicitly, which is how the
 * archive screens list deleted rows.
 */

export const SOFT_DELETE_FIELD = "deletedRecordId";

export const softDeleteModels = new Set([
  "SprintTask",
  "SprintMember",
  "Task",
  "Sprint",
  "Project",
  "Member",
]);

/** To-many relations that point at a soft-deletable model, keyed by the owning model. */
export const softDeleteRelations: Record<string, Record<string, string>> = {
  Member: { sprints: "SprintMember" },
  Project: { sprints: "Sprint" },
  Sprint: { sprintTasks: "SprintTask", sprintMembers: "SprintMember" },
  Task: { sprintTasks: "SprintTask" },
  SprintMember: { sprintTasks: "SprintTask" },
  DeleteRecord: {
    members: "Member",
    projects: "Project",
    sprints: "Sprint",
    tasks: "Task",
    sprintMembers: "SprintMember",
    sprintTasks: "SprintTask",
  },
  Snapshot: {
    members: "Member",
    projects: "Project",
    sprints: "Sprint",
    tasks: "Task",
    sprintMembers: "SprintMember",
    sprintTasks: "SprintTask",
  },
};

type Args = Record<string, unknown>;

const isObject = (value: unknown): value is Args =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Live-row filter for the where clause, unless the caller already set the field. */
export function withLiveFilter(where: unknown): Args {
  const base = isObject(where) ? where : {};
  if (SOFT_DELETE_FIELD in base) return base;
  return { ...base, [SOFT_DELETE_FIELD]: null };
}

/** Deep-filter `include`/`select` relations that point at soft-deletable models. */
export function filterNested(model: string, args: Args): Args {
  const relations = softDeleteRelations[model];
  const next: Args = { ...args };

  for (const key of ["include", "select"] as const) {
    const tree = args[key];
    if (!isObject(tree)) continue;

    const filtered: Args = {};
    for (const [field, value] of Object.entries(tree)) {
      const target = relations?.[field];
      if (!target || !value) {
        filtered[field] = value;
        continue;
      }
      const nested = isObject(value) ? value : {};
      filtered[field] = {
        ...filterNested(target, nested),
        where: withLiveFilter(nested.where),
      };
    }
    next[key] = filtered;
  }

  return next;
}

export const READ_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

/** Transform the args of a single model operation. */
export function transformArgs(
  model: string,
  operation: string,
  args: unknown
): Args {
  const input = isObject(args) ? args : {};
  const withNested =
    operation === "count" || operation === "aggregate" || operation === "groupBy"
      ? input
      : filterNested(model, input);

  if (softDeleteModels.has(model) && READ_OPERATIONS.has(operation)) {
    return { ...withNested, where: withLiveFilter(withNested.where) };
  }

  return withNested;
}
