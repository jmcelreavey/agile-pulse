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

/** Restore the shared demo workspace. Run daily by the Worker's cron trigger. */
export async function resetDemoDatabase(db: D1Database) {
  const { results } = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE ? ORDER BY rowid")
    .bind(`${TEMPLATE_PREFIX}%`)
    .all<{ name: string }>();
  const templates = results.map((row) => row.name);
  if (templates.length === 0) return 0;

  await db.batch([
    db.prepare('DELETE FROM "TRPCAudit"'),
    ...buildResetStatements(templates).map((sql) => db.prepare(sql)),
  ]);
  return templates.length;
}
