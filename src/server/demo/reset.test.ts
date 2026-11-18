import { buildResetStatements, isUntouched, TEMPLATE_PREFIX } from "~/server/demo/reset";

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

describe("isUntouched", () => {
  it("skips the reset only when nothing was audited and no task changed", () => {
    expect(isUntouched({ audits: 0, taskStamp: 1700000000000, templateTaskStamp: 1700000000000 })).toBe(true);
    expect(isUntouched({ audits: 2, taskStamp: 1700000000000, templateTaskStamp: 1700000000000 })).toBe(false);
    expect(isUntouched({ audits: 0, taskStamp: 1700000005000, templateTaskStamp: 1700000000000 })).toBe(false);
  });
});
