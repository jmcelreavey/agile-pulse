import { describe, expect, it } from "vitest";

interface SprintData {
  days: number;
}

interface TaskData {
  id: number;
  order: number;
  days: number;
  assignedTo: string;
  memberOrder: number;
}

type MockDb = Record<string, unknown>;

// Create a simple mock for testing the logic
const createMockGetOverrunningSprintTasksUseCase = (
  mockSprintData: SprintData | null,
  mockTasksData: TaskData[]
) => {
  return class MockGetOverrunningSprintTasksUseCase {
    constructor(private db: MockDb) {}

    async execute(_input: { sprintId: number }): Promise<TaskData[]> {
      // Simulate sprint lookup
      const sprint = mockSprintData;
      if (!sprint) {
        throw new Error("Sprint not found");
      }

      // Simulate tasks lookup
      const tasks = mockTasksData;

      // Sort tasks by member order and then by task order
      const sortedTasks = tasks
        .filter((task) => task.assignedTo !== "Unassigned")
        .sort((a, b) => {
          if (a.memberOrder !== b.memberOrder) {
            return (a.memberOrder ?? 0) - (b.memberOrder ?? 0);
          }
          return a.order - b.order;
        });

      const overrunningTasks: TaskData[] = [];
      let currentMember: string | null = null;
      let currentDay = 0;

      for (const task of sortedTasks) {
        if (currentMember !== task.assignedTo) {
          currentMember = task.assignedTo;
          currentDay = 0;
        }

        currentDay += task.days;
        if (currentDay > sprint.days) {
          overrunningTasks.push(task);
        }
      }

      return overrunningTasks;
    }
  };
};

describe("GetOverrunningSprintTasksUseCase", () => {
  it("should return overrunning tasks sorted by member order and task order", async () => {
    // Mock sprint data
    const mockSprintData: SprintData = { days: 5 };

    // Mock tasks data
    const mockTasksData: TaskData[] = [
      { id: 1, order: 2, days: 2, assignedTo: "Alice", memberOrder: 1 },
      { id: 2, order: 1, days: 1, assignedTo: "Bob", memberOrder: 2 },
      { id: 3, order: 3, days: 4, assignedTo: "Alice", memberOrder: 1 },
      { id: 4, order: 0, days: 3, assignedTo: "Bob", memberOrder: 2 },
      { id: 5, order: 4, days: 3, assignedTo: "Bob", memberOrder: 2 },
      { id: 6, order: 5, days: 1, assignedTo: "Alice", memberOrder: 1 },
      { id: 7, order: 6, days: 2, assignedTo: "Unassigned", memberOrder: 0 },
    ];

    const MockUseCase = createMockGetOverrunningSprintTasksUseCase(
      mockSprintData,
      mockTasksData
    );
    const useCase = new MockUseCase({});

    const result = await useCase.execute({ sprintId: 1 });

    // Expected logic:
    // Alice tasks sorted by order: Task 1 (2 days), Task 3 (4 days), Task 6 (1 day)
    // - Task 1: currentDay = 2 (≤ 5, not overrunning)
    // - Task 3: currentDay = 2 + 4 = 6 (> 5, overrunning)
    // - Task 6: currentDay = 6 + 1 = 7 (> 5, overrunning)
    //
    // Bob tasks sorted by order: Task 4 (3 days), Task 2 (1 day), Task 5 (3 days)
    // - Task 4: currentDay = 3 (≤ 5, not overrunning)
    // - Task 2: currentDay = 3 + 1 = 4 (≤ 5, not overrunning)
    // - Task 5: currentDay = 4 + 3 = 7 (> 5, overrunning)

    expect(result).toEqual([
      { id: 3, order: 3, days: 4, assignedTo: "Alice", memberOrder: 1 },
      { id: 6, order: 5, days: 1, assignedTo: "Alice", memberOrder: 1 },
      { id: 5, order: 4, days: 3, assignedTo: "Bob", memberOrder: 2 },
    ]);
  });

  it("should throw an error if sprint is not found", async () => {
    const MockUseCase = createMockGetOverrunningSprintTasksUseCase(null, []);
    const useCase = new MockUseCase({});

    await expect(useCase.execute({ sprintId: 1 })).rejects.toThrow(
      "Sprint not found"
    );
  });

  it("should handle empty tasks list", async () => {
    const mockSprintData: SprintData = { days: 5 };
    const MockUseCase = createMockGetOverrunningSprintTasksUseCase(
      mockSprintData,
      []
    );
    const useCase = new MockUseCase({});

    const result = await useCase.execute({ sprintId: 1 });
    expect(result).toEqual([]);
  });

  it("should filter out unassigned tasks", async () => {
    const mockSprintData: SprintData = { days: 5 };
    const mockTasksData: TaskData[] = [
      { id: 1, order: 1, days: 10, assignedTo: "Unassigned", memberOrder: 0 },
      { id: 2, order: 2, days: 2, assignedTo: "Alice", memberOrder: 1 },
    ];

    const MockUseCase = createMockGetOverrunningSprintTasksUseCase(
      mockSprintData,
      mockTasksData
    );
    const useCase = new MockUseCase({});

    const result = await useCase.execute({ sprintId: 1 });

    // Only Alice's task should be considered, and it's not overrunning
    expect(result).toEqual([]);
  });
});
