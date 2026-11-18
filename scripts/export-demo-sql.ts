/**
 * Builds the demo database from the seed scenarios and writes it out as plain SQL.
 *
 *   npm run demo:sql            -> .demo/demo.sql (schema + data)
 *
 * The same file seeds the local Cloudflare D1 database, the deployed demo, and the Worker's daily
 * reset, so every environment starts from identical data.
 */
import Database from "better-sqlite3";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { TEMPLATE_PREFIX } from "../src/server/demo/reset";

const outDir = resolve(".demo");
const dbFile = resolve(outDir, "demo.db");
mkdirSync(outDir, { recursive: true });
rmSync(dbFile, { force: true });

const env = { ...process.env, DATABASE_URL: `file:${dbFile}` };
execFileSync("npx", ["prisma", "db", "push"], { env, stdio: "inherit" });
execFileSync("npx", ["tsx", "src/seeding/runtime/seed.ts"], { env, stdio: "inherit" });

const db = new Database(dbFile, { readonly: true });
const tables = db
  .prepare(
    "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%' ORDER BY name"
  )
  .all() as { name: string; sql: string }[];
// Parents before children, so inserts never reference a row that doesn't exist yet.
const parentsOf = new Map(
  tables.map(({ name }) => [
    name,
    (db.prepare(`PRAGMA foreign_key_list("${name}")`).all() as { table: string }[])
      .map((fk) => fk.table)
      .filter((parent) => parent !== name),
  ])
);
const ordered: typeof tables = [];
const visit = (table: (typeof tables)[number], seen = new Set<string>()) => {
  if (ordered.includes(table) || seen.has(table.name)) return;
  seen.add(table.name);
  for (const parent of parentsOf.get(table.name) ?? []) {
    const parentTable = tables.find(({ name }) => name === parent);
    if (parentTable) visit(parentTable, seen);
  }
  ordered.push(table);
};
tables.forEach((table) => visit(table));
tables.splice(0, tables.length, ...ordered);

const indexes = db
  .prepare("SELECT sql FROM sqlite_master WHERE type = 'index' AND sql IS NOT NULL")
  .all() as { sql: string }[];

const quote = (value: unknown): string => {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  if (Buffer.isBuffer(value)) return `X'${value.toString("hex")}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
};

const lines: string[] = ["PRAGMA defer_foreign_keys = true;"];
for (const { name } of [...tables].reverse()) lines.push(`DROP TABLE IF EXISTS "${name}";`);
for (const { sql } of tables) lines.push(`${sql};`);
for (const { sql } of indexes) lines.push(`${sql};`);
// Audit rows are request logs from the seed itself, not demo content.
const dataTables = tables.filter(({ name }) => name !== "TRPCAudit");
for (const { name } of tables) lines.push(`DROP TABLE IF EXISTS "${TEMPLATE_PREFIX}${name}";`);
for (const { name } of dataTables) {
  const rows = db.prepare(`SELECT * FROM "${name}"`).all() as Record<string, unknown>[];
  for (const row of rows) {
    const columns = Object.keys(row).map((column) => `"${column}"`).join(", ");
    const values = Object.values(row).map(quote).join(", ");
    lines.push(`INSERT INTO "${name}" (${columns}) VALUES (${values});`);
  }
}

// Untouched copies the Worker's daily cron restores from (see worker.ts).
for (const { name } of dataTables) {
  lines.push(`CREATE TABLE "${TEMPLATE_PREFIX}${name}" AS SELECT * FROM "${name}";`);
}

writeFileSync(resolve(outDir, "demo.sql"), `${lines.join("\n")}\n`);
console.log(`Wrote .demo/demo.sql (${tables.length} tables, ${lines.length} statements)`);
