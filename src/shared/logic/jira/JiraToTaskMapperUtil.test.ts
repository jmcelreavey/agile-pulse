import { describe, expect, it } from "vitest";
import { State } from "~/shared/types/State";
import {
  type JiraIssue,
  extractUniqueJiraUsers,
  mapJiraIssueToTask,
  mapJiraStatusToState,
} from "~/shared/logic/jira/JiraToTaskMapperUtil";

describe("mapJiraStatusToState", () => {
  it("should map 'Done' to COMPLETED", () => {
    expect(mapJiraStatusToState("Done")).toBe(State.COMPLETED);
  });

  it("should map 'Closed' to COMPLETED", () => {
    expect(mapJiraStatusToState("Closed")).toBe(State.COMPLETED);
  });

  it("should map 'Resolved' to COMPLETED", () => {
    expect(mapJiraStatusToState("Resolved")).toBe(State.COMPLETED);
  });

  it("should map 'Complete' to COMPLETED", () => {
    expect(mapJiraStatusToState("Complete")).toBe(State.COMPLETED);
  });

  it("should map 'In Progress' to IN_PROGRESS", () => {
    expect(mapJiraStatusToState("In Progress")).toBe(State.IN_PROGRESS);
  });

  it("should map 'Development' to IN_PROGRESS", () => {
    expect(mapJiraStatusToState("Development")).toBe(State.IN_PROGRESS);
  });

  it("should map 'In Review' to IN_PROGRESS", () => {
    expect(mapJiraStatusToState("In Review")).toBe(State.IN_PROGRESS);
  });

  it("should map 'QA' to WITH_QA", () => {
    expect(mapJiraStatusToState("QA")).toBe(State.WITH_QA);
  });

  it("should map 'Testing' to WITH_QA", () => {
    expect(mapJiraStatusToState("Testing")).toBe(State.WITH_QA);
  });

  it("should map 'Blocked' to BLOCKED", () => {
    expect(mapJiraStatusToState("Blocked")).toBe(State.BLOCKED);
  });

  it("should map 'At Risk' to AT_RISK", () => {
    expect(mapJiraStatusToState("At Risk")).toBe(State.AT_RISK);
  });

  it("should map unknown status to NOT_STARTED", () => {
    expect(mapJiraStatusToState("To Do")).toBe(State.NOT_STARTED);
  });

  it("should be case insensitive", () => {
    expect(mapJiraStatusToState("in progress")).toBe(State.IN_PROGRESS);
    expect(mapJiraStatusToState("IN PROGRESS")).toBe(State.IN_PROGRESS);
  });
});

describe("mapJiraIssueToTask", () => {
  const mockIssue: JiraIssue = {
    id: "12345",
    key: "PROJECT-123",
    fields: {
      summary: "Test Issue",
      description: "Test Description",
      issuetype: {
        name: "Story",
      },
      assignee: {
        accountId: "user123",
        displayName: "John Doe",
      },
      status: {
        name: "In Progress",
      },
    },
  };

  it("should correctly map a Jira issue to task data", () => {
    const result = mapJiraIssueToTask(mockIssue);

    expect(result).toEqual({
      name: "PROJECT-123: Test Issue",
      description: "Test Description",
      state: State.IN_PROGRESS,
      jiraIssueKey: "PROJECT-123",
      jiraIssueId: "12345",
      jiraIssueType: "Story",
    });
  });

  it("should handle null description", () => {
    const issueWithoutDesc: JiraIssue = {
      ...mockIssue,
      fields: {
        ...mockIssue.fields,
        description: undefined,
      },
    };

    const result = mapJiraIssueToTask(issueWithoutDesc);

    expect(result.description).toBe(null);
  });

  it("should handle different statuses", () => {
    const issueWithDoneStatus: JiraIssue = {
      ...mockIssue,
      fields: {
        ...mockIssue.fields,
        status: {
          name: "Done",
        },
      },
    };

    const result = mapJiraIssueToTask(issueWithDoneStatus);

    expect(result.state).toBe(State.COMPLETED);
  });
});

describe("extractUniqueJiraUsers", () => {
  // Define issues individually for type safety
  const issue1: JiraIssue = {
    id: "1",
    key: "PROJECT-1",
    fields: {
      summary: "Issue 1",
      issuetype: { name: "Task" },
      status: { name: "To Do" },
      assignee: {
        accountId: "user1",
        displayName: "User One",
      },
    },
  };

  const issue2: JiraIssue = {
    id: "2",
    key: "PROJECT-2",
    fields: {
      summary: "Issue 2",
      issuetype: { name: "Bug" },
      status: { name: "In Progress" },
      assignee: {
        accountId: "user2",
        displayName: "User Two",
      },
    },
  };

  const issue3: JiraIssue = {
    id: "3",
    key: "PROJECT-3",
    fields: {
      summary: "Issue 3",
      issuetype: { name: "Task" },
      status: { name: "Done" },
      assignee: {
        accountId: "user1", // Duplicate user
        displayName: "User One",
      },
    },
  };

  const issue4: JiraIssue = {
    id: "4",
    key: "PROJECT-4",
    fields: {
      summary: "Issue 4",
      issuetype: { name: "Story" },
      status: { name: "To Do" },
    },
  };

  const mockIssues = [issue1, issue2, issue3, issue4];

  it("should extract unique users from issues", () => {
    const result = extractUniqueJiraUsers(mockIssues);

    expect(result).toHaveLength(2);
    expect(result.map((user) => user.accountId)).toEqual(["user1", "user2"]);
    expect(result.map((user) => user.displayName)).toEqual([
      "User One",
      "User Two",
    ]);
  });

  it("should handle issues without assignees", () => {
    const result = extractUniqueJiraUsers([issue4]);

    expect(result).toHaveLength(0);
  });

  it("should deduplicate users with the same account ID", () => {
    const result = extractUniqueJiraUsers([issue1, issue3]);

    expect(result).toHaveLength(1);
    expect(result[0]?.accountId).toBe("user1");
  });

  it("should return empty array for empty issues list", () => {
    const result = extractUniqueJiraUsers([]);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });
});
