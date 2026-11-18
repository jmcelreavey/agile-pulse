/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { type PrismaClient } from "~/generated/prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mapJiraIssueToTask } from "~/shared/logic/jira/JiraToTaskMapperUtil";
import { State } from "~/shared/types/State";
import {
  SyncSprintUseCase,
  type SyncSprintUseCaseInput,
} from "~/server/logic/jira/SyncSprintUseCase";

// Mock dependent use cases
vi.mock("./CreateSprintTaskFromJiraUseCase", () => {
  return {
    CreateSprintTaskFromJiraUseCase: vi.fn().mockImplementation(function () {
      return {
        execute: vi.fn().mockImplementation(({ taskData, sprintId }) => {
          const mockTaskId = Math.floor(Math.random() * 1000);
          const mockSprintTaskId = Math.floor(Math.random() * 1000);
          mockTaskCreate(taskData);
          mockSprintTaskCreate({
            data: {
              sprintId,
              taskId: mockTaskId,
              days: 1,
              sprintMemberId: null, // This will be tested separately
            },
          });
          return Promise.resolve({
            success: true,
            taskId: mockTaskId,
            sprintTaskId: mockSprintTaskId,
          });
        }),
      };
    }),
  };
});

vi.mock("./UpdateSprintTaskFromJiraUseCase", () => {
  return {
    UpdateSprintTaskFromJiraUseCase: vi.fn().mockImplementation(function () {
      return {
        execute: vi.fn().mockImplementation(({ existingTask, taskData }) => {
          mockTaskUpdate({
            where: { id: existingTask.task.id },
            data: taskData,
          });
          return Promise.resolve({ success: true });
        }),
      };
    }),
  };
});

// Create mock functions
const mockSprintFindUnique = vi.fn();
const mockTaskUpdate = vi.fn();
const mockTaskCreate = vi.fn();
const mockSprintTaskUpdate = vi.fn();
const mockSprintTaskCreate = vi.fn();
const mockSprintMemberFindFirst = vi.fn();
const mockUserFindMany = vi.fn();

// Create mock Prisma client
const mockDb = {
  sprint: { findUnique: mockSprintFindUnique },
  task: { update: mockTaskUpdate, create: mockTaskCreate },
  sprintTask: {
    update: mockSprintTaskUpdate,
    create: mockSprintTaskCreate,
    findFirst: mockSprintMemberFindFirst,
  },
  sprintMember: { findFirst: mockSprintMemberFindFirst },
  user: { findMany: mockUserFindMany },
} as unknown as PrismaClient;

const useCase = new SyncSprintUseCase(mockDb);

describe("SyncSprintUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockJiraIssues = [
    {
      id: "10001",
      key: "TEST-1",
      fields: {
        summary: "Implement user authentication",
        description: "Add login functionality",
        issuetype: { name: "Story" },
        assignee: {
          accountId: "jira-user-1",
          displayName: "John Doe",
        },
        status: { name: "In Progress" },
        customfield_10020: 5, // Story points
      },
    },
    {
      id: "10002",
      key: "TEST-2",
      fields: {
        summary: "Fix bug in payment processing",
        description: "Payment fails on checkout",
        issuetype: { name: "Bug" },
        assignee: {
          accountId: "jira-user-2",
          displayName: "Jane Smith",
        },
        status: { name: "Done" },
        customfield_10020: 3,
      },
    },
    {
      id: "10003",
      key: "TEST-3",
      fields: {
        summary: "Update documentation",
        issuetype: { name: "Task" },
        status: { name: "To Do" },
        // No assignee
      },
    },
  ];

  const mockSprint = {
    id: 1,
    reference: "SP-001",
    sprintMembers: [
      {
        id: 1,
        sprintId: 1,
        memberId: 1,
        member: { id: 1, name: "John Doe" },
      },
      {
        id: 2,
        sprintId: 1,
        memberId: 2,
        member: { id: 2, name: "Jane Smith" },
      },
    ],
    sprintTasks: [],
  };

  it("should successfully sync new Jira issues as tasks", async () => {
    // Arrange
    mockSprintFindUnique.mockResolvedValue(mockSprint);
    mockUserFindMany.mockResolvedValue([]);
    mockTaskCreate.mockImplementation((data) =>
      Promise.resolve({ id: Math.random(), ...data })
    );
    mockSprintMemberFindFirst.mockResolvedValue({ id: 1 });
    mockSprintTaskCreate.mockResolvedValue({ id: 1 });

    const input: SyncSprintUseCaseInput = {
      sprintId: 1,
      jiraIssues: mockJiraIssues,
      overrideExisting: false,
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.tasksCreated).toBe(3);
    expect(result.tasksUpdated).toBe(0);
    expect(result.tasksSkipped).toBe(0);

    // Just verify mockTaskCreate was called the right number of times
    expect(mockTaskCreate).toHaveBeenCalledTimes(3);
  });

  it("should skip existing tasks when overrideExisting is false", async () => {
    // Arrange
    const sprintWithExistingTasks = {
      ...mockSprint,
      sprintTasks: [
        {
          id: 1,
          task: { id: 1, jiraIssueKey: "TEST-1" },
        },
      ],
    };

    mockSprintFindUnique.mockResolvedValue(sprintWithExistingTasks);
    mockTaskCreate.mockImplementation((data) =>
      Promise.resolve({ id: Math.random(), ...data })
    );

    const input: SyncSprintUseCaseInput = {
      sprintId: 1,
      jiraIssues: mockJiraIssues,
      overrideExisting: false,
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.tasksCreated).toBe(2); // Only TEST-2 and TEST-3
    expect(result.tasksSkipped).toBe(1); // TEST-1 was skipped
    expect(result.tasksUpdated).toBe(0);
  });

  it("should update existing tasks when overrideExisting is true", async () => {
    // Arrange
    const sprintWithExistingTasks = {
      ...mockSprint,
      sprintTasks: [
        {
          id: 1,
          sprintId: 1,
          task: { id: 1, jiraIssueKey: "TEST-1" },
        },
      ],
    };

    mockSprintFindUnique.mockResolvedValue(sprintWithExistingTasks);
    mockTaskUpdate.mockResolvedValue({ id: 1 });
    mockSprintTaskUpdate.mockResolvedValue({ id: 1 });
    mockSprintMemberFindFirst.mockResolvedValue({ id: 1 });

    const input: SyncSprintUseCaseInput = {
      sprintId: 1,
      jiraIssues: [mockJiraIssues[0]!], // Only TEST-1
      overrideExisting: true,
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.tasksCreated).toBe(0);
    expect(result.tasksUpdated).toBe(1);
    expect(result.tasksSkipped).toBe(0);

    // Verify mockTaskUpdate was called
    expect(mockTaskUpdate).toHaveBeenCalledTimes(1);
    expect(mockTaskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
      })
    );
  });

  it("should handle unassigned tasks correctly", async () => {
    // Arrange
    const unassignedIssue = {
      id: "10004",
      key: "TEST-4",
      fields: {
        summary: "Unassigned task",
        issuetype: { name: "Task" },
        status: { name: "To Do" },
        // No assignee
      },
    };

    mockSprintFindUnique.mockResolvedValue(mockSprint);
    mockTaskCreate.mockImplementation((data) =>
      Promise.resolve({ id: Math.random(), ...data })
    );
    mockSprintTaskCreate.mockResolvedValue({ id: 1 });
    mockSprintMemberFindFirst.mockResolvedValue(null);

    const input: SyncSprintUseCaseInput = {
      sprintId: 1,
      jiraIssues: [unassignedIssue],
      overrideExisting: false,
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.tasksCreated).toBe(1);

    // Verify sprint task was created with null sprintMemberId
    expect(mockSprintTaskCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sprintMemberId: null,
      }),
    });
  });

  it("should map Jira statuses to application states correctly", async () => {
    // Arrange
    const issuesWithVariousStatuses = [
      {
        id: "1",
        key: "TEST-1",
        fields: {
          summary: "Done task",
          issuetype: { name: "Task" },
          status: { name: "Done" },
        },
      },
      {
        id: "2",
        key: "TEST-2",
        fields: {
          summary: "In progress task",
          issuetype: { name: "Task" },
          status: { name: "In Development" },
        },
      },
      {
        id: "3",
        key: "TEST-3",
        fields: {
          summary: "QA task",
          issuetype: { name: "Task" },
          status: { name: "Testing" },
        },
      },
      {
        id: "4",
        key: "TEST-4",
        fields: {
          summary: "Blocked task",
          issuetype: { name: "Task" },
          status: { name: "Blocked" },
        },
      },
    ];

    mockSprintFindUnique.mockResolvedValue(mockSprint);
    mockTaskCreate.mockImplementation((data) =>
      Promise.resolve({ id: Math.random(), ...data })
    );

    const input: SyncSprintUseCaseInput = {
      sprintId: 1,
      jiraIssues: issuesWithVariousStatuses,
      overrideExisting: false,
    };

    // Act
    await useCase.execute(input);

    // Assert - verify that each task gets mapped to the correct state
    const mappedTasks = issuesWithVariousStatuses.map((issue) =>
      mapJiraIssueToTask(issue)
    );
    expect(mappedTasks[0]?.state).toBe(State.COMPLETED);
    expect(mappedTasks[1]?.state).toBe(State.IN_PROGRESS);
    expect(mappedTasks[2]?.state).toBe(State.WITH_QA);
    expect(mappedTasks[3]?.state).toBe(State.BLOCKED);
  });

  it("should throw error when sprint is not found", async () => {
    // Arrange
    mockSprintFindUnique.mockResolvedValue(null);

    const input: SyncSprintUseCaseInput = {
      sprintId: 999,
      jiraIssues: mockJiraIssues,
      overrideExisting: false,
    };

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow("Sprint not found");
  });
});
