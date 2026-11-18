import { transformArgs } from "~/server/db/softDelete";

describe("soft delete query rewriting", () => {
  it("hides archived rows from reads of soft-deletable models", () => {
    expect(transformArgs("Project", "findMany", { where: { domain: "a" } })).toEqual({
      where: { domain: "a", deletedRecordId: null },
    });
  });

  it("leaves queries that ask for archived rows alone", () => {
    const args = { where: { deletedRecordId: { not: null } } };
    expect(transformArgs("Member", "findMany", args)).toEqual(args);
  });

  it("filters to-many includes that point at soft-deletable models", () => {
    expect(
      transformArgs("Project", "findFirst", { include: { sprints: { include: { sprintTasks: true } } } })
    ).toEqual({
      where: { deletedRecordId: null },
      include: {
        sprints: {
          include: { sprintTasks: { where: { deletedRecordId: null } } },
          where: { deletedRecordId: null },
        },
      },
    });
  });

  it("does not touch models without soft delete", () => {
    expect(transformArgs("User", "findMany", { where: { id: 1 } })).toEqual({ where: { id: 1 } });
  });

  it("does not rewrite writes", () => {
    expect(transformArgs("Task", "update", { where: { id: 1 }, data: {} })).toEqual({
      where: { id: 1 },
      data: {},
    });
  });
});
