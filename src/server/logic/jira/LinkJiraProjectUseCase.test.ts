 
import { type PrismaClient } from "~/generated/prisma/client";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { LinkJiraProjectInput } from "~/server/api/schemas/jira";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { LinkJiraProjectUseCase } from "~/server/logic/jira/LinkJiraProjectUseCase";

// Create mock functions
const mockProjectUpdate = vi.fn();
const mockProjectFindFirst = vi.fn();

// Create mock Prisma client
const mockDb = {
  project: {
    update: mockProjectUpdate,
    findFirst: mockProjectFindFirst,
  },
} as unknown as PrismaClient;

describe("LinkJiraProjectUseCase", () => {
  let useCase: LinkJiraProjectUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new LinkJiraProjectUseCase(mockDb);
  });

  test("should successfully link project to Jira", async () => {
    // Arrange
    const input: LinkJiraProjectInput = {
      projectId: 1,
      jiraProjectKey: "PROJ",
      jiraProjectId: "10001",
    };

    const mockProject = { id: 1, name: "Test Project" };
    const mockUpdatedProject = {
      id: 1,
      jiraProjectKey: "PROJ",
      jiraProjectId: "10001",
    };

    mockProjectFindFirst.mockResolvedValue(mockProject);
    mockProjectUpdate.mockResolvedValue(mockUpdatedProject);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result).toEqual({ success: true });
    expect(mockProjectFindFirst).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(mockProjectUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        jiraProjectKey: "PROJ",
        jiraProjectId: "10001",
      },
    });
  });

  test("should throw RecordNotFoundError when project does not exist", async () => {
    // Arrange
    const input: LinkJiraProjectInput = {
      projectId: 999,
      jiraProjectKey: "PROJ",
      jiraProjectId: "10001",
    };

    mockProjectFindFirst.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(
      new RecordNotFoundError("Project not found")
    );

    expect(mockProjectFindFirst).toHaveBeenCalledWith({
      where: { id: 999 },
    });
    expect(mockProjectUpdate).not.toHaveBeenCalled();
  });

  test("should handle database update errors gracefully", async () => {
    // Arrange
    const input: LinkJiraProjectInput = {
      projectId: 5,
      jiraProjectKey: "TEST",
      jiraProjectId: "20001",
    };

    const mockProject = { id: 5, name: "Test Project" };
    const dbError = new Error("Database update failed");

    mockProjectFindFirst.mockResolvedValue(mockProject);
    mockProjectUpdate.mockRejectedValue(dbError);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(
      "Database update failed"
    );

    expect(mockProjectFindFirst).toHaveBeenCalledWith({
      where: { id: 5 },
    });
    expect(mockProjectUpdate).toHaveBeenCalledWith({
      where: { id: 5 },
      data: {
        jiraProjectKey: "TEST",
        jiraProjectId: "20001",
      },
    });
  });
});
