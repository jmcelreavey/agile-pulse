import { type PrismaClient } from "~/generated/prisma/client";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { GetJiraConnectionStatusUseCase } from "~/server/logic/jira/GetJiraConnectionStatusUseCase";

// Create mock functions
const mockUserFindUnique = vi.fn();
const mockAccountFindFirst = vi.fn();
const mockAccountUpdate = vi.fn();

// Create mock Prisma client
const mockDb = {
  user: {
    findUnique: mockUserFindUnique,
  },
  account: {
    findFirst: mockAccountFindFirst,
    update: mockAccountUpdate,
  },
} as unknown as PrismaClient;

// Mock user for authenticated use case
const mockUser = { id: 1, domain: "example.com" };

describe("GetJiraConnectionStatusUseCase", () => {
  let useCase: GetJiraConnectionStatusUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new GetJiraConnectionStatusUseCase(mockDb, mockUser);
  });

  test("should return connected status when user has Jira account linked", async () => {
    // Arrange
    const mockUserWithJira = {
      jiraAccountId: "jira-account-123",
      jiraCloudId: "cloud-123",
      fullName: "John Doe",
      jiraAccessToken: "access-token-123",
      domain: null,
    };

    const mockOAuthAccount = {
      access_token: "access-token-123",
      refresh_token: "refresh-token-123",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      id: "account-1",
    };

    mockAccountFindFirst.mockResolvedValue(mockOAuthAccount);
    mockUserFindUnique.mockResolvedValue(mockUserWithJira);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result).toEqual({
      isConnected: true,
      connectionType: "oauth",
      fullName: "John Doe",
      cloudId: "cloud-123",
      domain: null,
      hasOAuthAccount: true,
    });

    expect(mockAccountFindFirst).toHaveBeenCalledWith({
      where: {
        userId: 1,
        provider: "atlassian",
      },
      select: {
        access_token: true,
        refresh_token: true,
        expires_at: true,
        id: true,
      },
    });

    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: {
        jiraAccountId: true,
        jiraCloudId: true,
        fullName: true,
        jiraAccessToken: true,
        domain: true,
      },
    });
  });

  test("should return not connected status when user has no Jira account", async () => {
    // Arrange
    const mockUserWithoutJira = {
      jiraAccountId: null,
      jiraCloudId: null,
      fullName: "Jane Smith",
      jiraAccessToken: null,
      domain: null,
    };

    mockAccountFindFirst.mockResolvedValue(null);
    mockUserFindUnique.mockResolvedValue(mockUserWithoutJira);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result).toEqual({
      isConnected: false,
      connectionType: null,
      fullName: "Jane Smith",
      cloudId: null,
      domain: null,
      hasOAuthAccount: false,
    });

    expect(mockAccountFindFirst).toHaveBeenCalledWith({
      where: {
        userId: 1,
        provider: "atlassian",
      },
      select: {
        access_token: true,
        refresh_token: true,
        expires_at: true,
        id: true,
      },
    });

    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: {
        jiraAccountId: true,
        jiraCloudId: true,
        fullName: true,
        jiraAccessToken: true,
        domain: true,
      },
    });
  });

  test("should return not connected status when user is not found", async () => {
    // Arrange
    mockAccountFindFirst.mockResolvedValue(null);
    mockUserFindUnique.mockResolvedValue(null);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result).toEqual({
      isConnected: false,
      connectionType: null,
      fullName: null,
      cloudId: null,
      domain: null,
      hasOAuthAccount: false,
    });

    expect(mockAccountFindFirst).toHaveBeenCalledWith({
      where: {
        userId: 1,
        provider: "atlassian",
      },
      select: {
        access_token: true,
        refresh_token: true,
        expires_at: true,
        id: true,
      },
    });

    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: {
        jiraAccountId: true,
        jiraCloudId: true,
        fullName: true,
        jiraAccessToken: true,
        domain: true,
      },
    });
  });

  test("should handle empty jiraAccountId as not connected", async () => {
    // Arrange
    const mockUserWithEmptyJira = {
      jiraAccountId: "",
      jiraCloudId: "",
      fullName: "Bob Wilson",
      jiraAccessToken: null,
      domain: null,
    };

    mockAccountFindFirst.mockResolvedValue(null);
    mockUserFindUnique.mockResolvedValue(mockUserWithEmptyJira);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result).toEqual({
      isConnected: false,
      connectionType: null,
      fullName: "Bob Wilson",
      cloudId: "",
      domain: null,
      hasOAuthAccount: false,
    });
  });

  test("should handle null fullName gracefully", async () => {
    // Arrange
    const mockUserWithNullName = {
      jiraAccountId: "jira-account-456",
      jiraCloudId: "cloud-456",
      fullName: null,
      jiraAccessToken: "access-token-456",
      domain: null,
    };

    const mockOAuthAccount = {
      access_token: "access-token-456",
      refresh_token: "refresh-token-456",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      id: "account-2",
    };

    mockAccountFindFirst.mockResolvedValue(mockOAuthAccount);
    mockUserFindUnique.mockResolvedValue(mockUserWithNullName);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result).toEqual({
      isConnected: true,
      connectionType: "oauth",
      fullName: null,
      cloudId: "cloud-456",
      domain: null,
      hasOAuthAccount: true,
    });
  });

  test("should handle database errors gracefully", async () => {
    // Arrange
    const dbError = new Error("Database connection failed");
    mockAccountFindFirst.mockRejectedValue(dbError);

    // Act & Assert
    await expect(useCase.execute()).rejects.toThrow(
      "Database connection failed"
    );

    expect(mockAccountFindFirst).toHaveBeenCalledWith({
      where: {
        userId: 1,
        provider: "atlassian",
      },
      select: {
        access_token: true,
        refresh_token: true,
        expires_at: true,
        id: true,
      },
    });
  });
});
