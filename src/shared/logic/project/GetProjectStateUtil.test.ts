import { describe, expect, it } from "vitest";
import { GetProjectStateUtil } from "~/shared/logic/project/GetProjectStateUtil";
import { State } from "~/shared/types/State";

describe("GetProjectStateUtil", () => {
  const anyDate = expect.any(Date) as Date;
  it("should return a partial project with default state when no parameters are provided", () => {
    const result = GetProjectStateUtil();
    expect(result).toEqual({
      state: State.NOT_STARTED,
      completedAt: undefined,
      startedAt: undefined,
    });
  });

  it("should not set startedAt when state is IN_PROGRESS and previous state is COMPLETED", () => {
    const result = GetProjectStateUtil(State.IN_PROGRESS, State.COMPLETED);
    expect(result).not.toEqual({
      state: State.IN_PROGRESS,
      completedAt: undefined,
      startedAt: anyDate,
    });
  });

  it("should not set startedAt when state is IN_PROGRESS and previous state is IN_PROGRESS", () => {
    const result = GetProjectStateUtil(State.IN_PROGRESS, State.IN_PROGRESS);
    expect(result).not.toEqual({
      state: State.IN_PROGRESS,
      completedAt: undefined,
      startedAt: anyDate,
    });
  });

  it("should set completedAt when state is COMPLETED and previous state is not COMPLETED", () => {
    const result = GetProjectStateUtil(State.COMPLETED, State.IN_PROGRESS);
    expect(result).toEqual({
      state: State.COMPLETED,
      completedAt: anyDate,
      startedAt: undefined,
    });
  });

  it("should set startedAt when state is IN_PROGRESS and previous state is NOT_STARTED", () => {
    const result = GetProjectStateUtil(State.IN_PROGRESS, State.NOT_STARTED);
    expect(result).toEqual({
      state: State.IN_PROGRESS,
      completedAt: undefined,
      startedAt: anyDate,
    });
  });

  it("should not set completedAt when state is COMPLETED and previous state is COMPLETED", () => {
    const result = GetProjectStateUtil(State.COMPLETED, State.COMPLETED);
    expect(result).toEqual({
      state: State.COMPLETED,
      completedAt: undefined,
      startedAt: undefined,
    });
  });

  it("should handle string states correctly", () => {
    const result = GetProjectStateUtil("In Progress", "Not Started");
    expect(result).toEqual({
      state: State.IN_PROGRESS,
      startedAt: anyDate,
      completedAt: undefined,
    });
  });
});
