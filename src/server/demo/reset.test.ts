import { buildResetStatements, TEMPLATE_PREFIX } from "~/server/demo/reset";

describe("buildResetStatements", () => {
  it("clears children first, then refills parents first from the template copies", () => {
    expect(buildResetStatements([`${TEMPLATE_PREFIX}Project`, `${TEMPLATE_PREFIX}Task`])).toEqual([
      'DELETE FROM "Task";',
      'DELETE FROM "Project";',
      'INSERT INTO "Project" SELECT * FROM "tpl_Project";',
      'INSERT INTO "Task" SELECT * FROM "tpl_Task";',
    ]);
  });
});
