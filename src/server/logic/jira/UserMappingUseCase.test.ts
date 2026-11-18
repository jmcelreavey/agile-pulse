/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type PrismaClient } from "~/generated/prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  UserMappingUseCase,
  type UserMappingInput,
} from "~/server/logic/jira/UserMappingUseCase";

// Create mock functions
const mockSprintFindUnique = vi.fn();
const mockUserFindMany = vi.fn();
const mockMemberFindMany = vi.fn();

// Create mock Prisma client
const mockDb = {
  sprint: { findUnique: mockSprintFindUnique },
  user: { findMany: mockUserFindMany },
  member: { findMany: mockMemberFindMany },
} as unknown as PrismaClient;

const useCase = new UserMappingUseCase(mockDb);

describe("UserMappingUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockJiraUsers = [
    {
      accountId: "jira1",
      displayName: "John Doe",
      emailAddress: "john.doe@company.com",
    },
    {
      accountId: "jira2",
      displayName: "Jane Smith",
      emailAddress: "jane.smith@company.com",
    },
    {
      accountId: "jira3",
      displayName: "Bob Wilson",
      emailAddress: "bob.wilson@company.com",
    },
  ];

  const mockSprint = {
    id: 1,
    reference: "SP-001",
    days: 10,
    daysRemaining: 5,
    state: "In Progress",
    startedAt: new Date(),
    completedAt: null,
    projectId: 1,
    deletedRecordId: null,
    snapshotId: null,
    notes: null,
    jiraSprintId: "123",
    lastSyncedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    sprintMembers: [
      {
        id: 1,
        sprintId: 1,
        memberId: 1,
        order: 1,
        deletedRecordId: null,
        snapshotId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        member: {
          id: 1,
          name: "John Doe",
          deletedRecordId: null,
          snapshotId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      {
        id: 2,
        sprintId: 1,
        memberId: 2,
        order: 2,
        deletedRecordId: null,
        snapshotId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        member: {
          id: 2,
          name: "Jane Smith",
          deletedRecordId: null,
          snapshotId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ],
    project: {
      id: 1,
      name: "Test Project",
      description: "Test Description",
      state: "In Progress",
      notes: null,
      startedAt: new Date(),
      completedAt: null,
      colour: null,
      deletedRecordId: null,
      snapshotId: null,
      ticketUrlTemplate: null,
      ticketUrlPrefix: null,
      domain: null,
      jiraProjectKey: "TEST",
      jiraProjectId: "10001",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockUsers = [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@company.com",
      emailVerified: null,
      image: null,
      domain: null,
      jiraAccountId: null,
      jiraAccessToken: null,
      fullName: null,
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@company.com",
      emailVerified: null,
      image: null,
      domain: null,
      jiraAccountId: null,
      jiraAccessToken: null,
      fullName: null,
    },
  ];

  it("should successfully map Jira users to existing members and users", async () => {
    // Arrange
    mockSprintFindUnique.mockResolvedValue(mockSprint);
    mockUserFindMany.mockResolvedValue(mockUsers);

    const input: UserMappingInput = {
      jiraUsers: mockJiraUsers,
      sprintId: 1,
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.totalJiraUsers).toBe(3);
    expect(result.totalMappedUsers).toBe(2);
    expect(result.unmappedJiraUsers).toHaveLength(1);
    expect(result.unmappedJiraUsers[0]?.emailAddress).toBe(
      "bob.wilson@company.com"
    );

    expect(result.mappings).toHaveLength(3);

    // Check first mapping (should be mapped)
    const johnMapping = result.mappings.find(
      (m) => m.jiraUser.emailAddress === "john.doe@company.com"
    );
    expect(johnMapping?.member).toBeTruthy();
    expect(johnMapping?.user).toBeTruthy();
    expect(johnMapping?.member?.name).toBe("John Doe");

    // Check second mapping (should be mapped)
    const janeMapping = result.mappings.find(
      (m) => m.jiraUser.emailAddress === "jane.smith@company.com"
    );
    expect(janeMapping?.member).toBeTruthy();
    expect(janeMapping?.user).toBeTruthy();
    expect(janeMapping?.member?.name).toBe("Jane Smith");

    // Check third mapping (should not be mapped)
    const bobMapping = result.mappings.find(
      (m) => m.jiraUser.emailAddress === "bob.wilson@company.com"
    );
    expect(bobMapping?.member).toBeNull();
    expect(bobMapping?.user).toBeNull();

    // Verify database calls
    expect(mockSprintFindUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        sprintMembers: {
          where: { deletedRecordId: null },
          include: { member: true },
        },
        project: true,
      },
    });

    expect(mockUserFindMany).toHaveBeenCalledWith({
      where: {
        email: {
          in: [
            "john.doe@company.com",
            "jane.smith@company.com",
            "bob.wilson@company.com",
          ],
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  });

  it("should throw error when sprint is not found", async () => {
    // Arrange
    mockSprintFindUnique.mockResolvedValue(null);

    const input: UserMappingInput = {
      jiraUsers: mockJiraUsers,
      sprintId: 1,
    };

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow("Sprint not found");

    expect(mockSprintFindUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: expect.objectContaining({
        sprintMembers: expect.objectContaining({
          where: { deletedRecordId: null },
          include: { member: true },
        }),
        project: true,
      }),
    });
  });

  it("should handle empty jira users list", async () => {
    // Arrange
    mockSprintFindUnique.mockResolvedValue(mockSprint);
    mockUserFindMany.mockResolvedValue([]);

    const input: UserMappingInput = {
      jiraUsers: [],
      sprintId: 1,
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.totalJiraUsers).toBe(0);
    expect(result.totalMappedUsers).toBe(0);
    expect(result.unmappedJiraUsers).toHaveLength(0);
    expect(result.mappings).toHaveLength(0);
  });

  it("should handle jira users with no email addresses", async () => {
    // Arrange
    const jiraUsersWithoutEmail = [
      {
        accountId: "jira1",
        displayName: "John Doe",
        emailAddress: "",
      },
      {
        accountId: "jira2",
        displayName: "Jane Smith",
        emailAddress: "",
      },
    ];

    mockSprintFindUnique.mockResolvedValue(mockSprint);
    mockUserFindMany.mockResolvedValue([]); // No users found by email

    const input: UserMappingInput = {
      jiraUsers: jiraUsersWithoutEmail,
      sprintId: 1,
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.totalJiraUsers).toBe(2);
    expect(result.totalMappedUsers).toBe(2); // Should match by display name with members
    expect(result.unmappedJiraUsers).toHaveLength(0);

    // Verify mappings by display name (matched to members, not users)
    const johnMapping = result.mappings.find(
      (m) => m.jiraUser.displayName === "John Doe"
    );
    expect(johnMapping?.member?.name).toBe("John Doe");
    expect(johnMapping?.user).toBeNull(); // No user match since no email match
  });

  it("should perform case-insensitive email matching", async () => {
    // Arrange
    const jiraUsersWithDifferentCase = [
      {
        accountId: "jira1",
        displayName: "John Doe",
        emailAddress: "JOHN.DOE@COMPANY.COM", // Different case
      },
    ];

    const usersWithLowerCase = [
      {
        id: 1,
        name: "John Doe",
        email: "john.doe@company.com",
        emailVerified: null,
        image: null,
        domain: null,
        jiraAccountId: null,
        jiraAccessToken: null,
        fullName: null,
      },
    ];

    mockSprintFindUnique.mockResolvedValue(mockSprint);
    mockUserFindMany.mockResolvedValue(usersWithLowerCase);

    const input: UserMappingInput = {
      jiraUsers: jiraUsersWithDifferentCase,
      sprintId: 1,
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.totalJiraUsers).toBe(1);
    expect(result.totalMappedUsers).toBe(1);
    expect(result.unmappedJiraUsers).toHaveLength(0);

    const johnMapping = result.mappings[0];
    expect(johnMapping?.user?.email).toBe("john.doe@company.com");
    expect(johnMapping?.member?.name).toBe("John Doe"); // Also matched by name
  });

  it("should match by display name when user name matching fails", async () => {
    // Arrange
    const jiraUsersWithUnknownEmail = [
      {
        accountId: "jira1",
        displayName: "John Doe",
        emailAddress: "unknown@example.com",
      },
    ];

    mockSprintFindUnique.mockResolvedValue(mockSprint);
    mockUserFindMany.mockResolvedValue([]); // No users found by email

    const input: UserMappingInput = {
      jiraUsers: jiraUsersWithUnknownEmail,
      sprintId: 1,
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.totalJiraUsers).toBe(1);
    expect(result.totalMappedUsers).toBe(1); // Should match by display name to member
    expect(result.unmappedJiraUsers).toHaveLength(0);

    const johnMapping = result.mappings[0];
    expect(johnMapping?.member?.name).toBe("John Doe");
    expect(johnMapping?.user).toBeNull(); // No user match since email doesn't exist
  });

  it("should search across all domain members when domain is provided", async () => {
    // Arrange
    const domainMembers = [
      {
        id: 3,
        name: "Domain User",
      },
    ];

    mockSprintFindUnique.mockResolvedValue(mockSprint);
    mockUserFindMany.mockResolvedValue([]);
    mockMemberFindMany.mockResolvedValue(domainMembers);

    const input: UserMappingInput = {
      jiraUsers: [
        {
          accountId: "jira3",
          displayName: "Domain User",
          emailAddress: "domain.user@company.com",
        },
      ],
      sprintId: 1,
      domain: "company.com", // Pass domain as parameter
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.totalJiraUsers).toBe(1);
    expect(result.totalMappedUsers).toBe(1);

    // Verify domain members were queried
    expect(mockMemberFindMany).toHaveBeenCalledWith({
      where: {
        deletedRecordId: null,
        sprints: {
          some: {
            sprint: {
              project: {
                domain: "company.com",
              },
            },
            deletedRecordId: null,
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });
  });

  it("should fallback to sprint members when no domain is provided", async () => {
    // Arrange
    const jiraUsersMatchingSprintMembers = [
      {
        accountId: "jira1",
        displayName: "John Doe",
        emailAddress: "john.doe@company.com",
      },
    ];

    mockSprintFindUnique.mockResolvedValue(mockSprint);
    mockUserFindMany.mockResolvedValue(mockUsers);

    const input: UserMappingInput = {
      jiraUsers: jiraUsersMatchingSprintMembers,
      sprintId: 1,
      // No domain provided - should use sprint members
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.totalJiraUsers).toBe(1);
    expect(result.totalMappedUsers).toBe(1);

    // Should match with sprint member by name and user by email
    const johnMapping = result.mappings[0];
    expect(johnMapping?.member?.name).toBe("John Doe");
    expect(johnMapping?.user?.name).toBe("John Doe");
  });
});
