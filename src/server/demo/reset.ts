import type { D1Database } from "@cloudflare/workers-types";

/** Prefix of the pristine copies of each demo table, written by `npm run demo:sql`. */
export const TEMPLATE_PREFIX = "tpl_";

/**
 * Statements that put every demo table back to its seeded state. Templates arrive parents-first
 * (their creation order), so rows are cleared children-first and refilled parents-first.
 */
export function buildResetStatements(templateTables: string[]): string[] {
  const tables = templateTables.map((template) => ({
    template,
    table: template.slice(TEMPLATE_PREFIX.length),
  }));
  return [
    ...[...tables].reverse().map(({ table }) => `DELETE FROM "${table}";`),
    ...tables.map(({ table, template }) => `INSERT INTO "${table}" SELECT * FROM "${template}";`),
  ];
}

/**
 * True when nobody has changed the demo since the last reset: no tRPC mutations were audited (the
 * reset clears the audit table) and no task was touched outside tRPC, for example by the weekday
 * stale-PR sweep. Skipping the reset then saves a full rewrite of every table, which matters on
 * D1's free tier of 100,000 written rows a day.
 */
export function isUntouched(state: { audits: number; taskStamp: string | number | null; templateTaskStamp: string | number | null }) {
  return state.audits === 0 && String(state.taskStamp) === String(state.templateTaskStamp);
}

/** Restore the shared demo workspace. Run daily by the Worker's cron trigger. */
export async function resetDemoDatabase(db: D1Database) {
  const { results } = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE ? ORDER BY rowid")
    .bind(`${TEMPLATE_PREFIX}%`)
    .all<{ name: string }>();
  const templates = results.map((row) => row.name);
  if (templates.length === 0) return 0;

  if (templates.includes(`${TEMPLATE_PREFIX}Task`)) {
    const state = await db
      .prepare(
        `SELECT (SELECT COUNT(*) FROM "TRPCAudit") AS audits, (SELECT MAX("updatedAt") FROM "Task") AS taskStamp, (SELECT MAX("updatedAt") FROM "${TEMPLATE_PREFIX}Task") AS templateTaskStamp`
      )
      .first<{ audits: number; taskStamp: string | number | null; templateTaskStamp: string | number | null }>();
    if (state && isUntouched(state)) return 0;
  }

  await db.batch([
    db.prepare('DELETE FROM "TRPCAudit"'),
    ...buildResetStatements(templates).map((sql) => db.prepare(sql)),
  ]);
  return templates.length;
}
