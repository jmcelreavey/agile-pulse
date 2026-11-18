import { beforeEach, describe, expect, it, vi } from "vitest";
import { JiraApiClient } from "~/server/logic/jira/JiraApiClient";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("JiraApiClient", () => {
  let client: JiraApiClient;
  const mockCloudId = "test-cloud-id";
  const mockAccessToken = "test-access-token";

  beforeEach(() => {
    client = new JiraApiClient(mockCloudId, mockAccessToken);
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create instance with correct base URL", () => {
      expect(client).toBeInstanceOf(JiraApiClient);
    });
  });

  describe("getCurrentUser", () => {
    it("should fetch current user successfully", async () => {
      const mockUser = {
        accountId: "user123",
        displayName: "John Doe",
        emailAddress: "john@example.com",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const result = await client.getCurrentUser();

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.atlassian.com/ex/jira/${mockCloudId}/rest/api/3/myself`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          }) as Record<string, string>,
        })
      );
      expect(result).toEqual(mockUser);
    });

    it("should throw error when API call fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "Invalid token",
      });

      await expect(client.getCurrentUser()).rejects.toThrow(
        "Your Jira authentication has expired. Please re-link your Jira account in the settings to continue accessing Jira features."
      );
    });
  });

  describe("getProjects", () => {
    it("should fetch projects successfully", async () => {
      const mockProjects = {
        values: [
          {
            id: "proj1",
            key: "PROJ1",
            name: "Project 1",
            projectTypeKey: "software",
          },
          {
            id: "proj2",
            key: "PROJ2",
            name: "Project 2",
            projectTypeKey: "software",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects,
      });

      const result = await client.getProjects();

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.atlassian.com/ex/jira/${mockCloudId}/rest/api/3/project/search`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
          }) as Record<string, string>,
        })
      );
      expect(result).toEqual(mockProjects.values);
    });
  });

  describe("getSprints", () => {
    it("should fetch all sprints (active, future, closed) from Scrum board with proper state filtering", async () => {
      const mockBoards = {
        values: [
          {
            id: 123,
            name: "Scrum Board",
            type: "scrum",
            self: "https://test.atlassian.net/rest/agile/1.0/board/123",
          },
        ],
      };
      const mockSprints = {
        values: [
          {
            id: 1,
            name: "Sprint 1",
            state: "active" as const,
            startDate: "2024-01-01",
            endDate: "2024-01-14",
          },
          {
            id: 2,
            name: "Sprint 2",
            state: "future" as const,
            startDate: "2024-01-15",
            endDate: "2024-01-28",
          },
          {
            id: 3,
            name: "Sprint 3",
            state: "closed" as const,
            startDate: "2023-12-01",
            endDate: "2023-12-14",
          },
        ],
        isLast: true,
        startAt: 0,
        maxResults: 50,
      };

      // Mock board fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBoards,
      });

      // Mock sprints fetch with all states
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSprints,
      });

      const result = await client.getSprints("TEST");

      expect(result).toEqual(mockSprints.values);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Verify the sprint call includes all states and pagination
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining(
          "state=active,future,closed&startAt=0&maxResults=50"
        ),
        expect.any(Object)
      );
    });

    it("should handle pagination when fetching sprints", async () => {
      const mockBoards = {
        values: [
          {
            id: 123,
            name: "Scrum Board",
            type: "scrum",
            self: "https://test.atlassian.net/rest/agile/1.0/board/123",
          },
        ],
      };

      // First page of sprints (has 2 items, and isLast=false to trigger pagination)
      const mockSprintsPage1 = {
        values: [
          { id: 1, name: "Sprint 1", state: "closed" as const },
          { id: 2, name: "Sprint 2", state: "active" as const },
        ],
        isLast: false, // This triggers the next page fetch
        startAt: 0,
        maxResults: 50,
      };

      // Second page of sprints (has 1 item, isLast=true to stop pagination)
      const mockSprintsPage2 = {
        values: [{ id: 3, name: "Sprint 3", state: "future" as const }],
        isLast: true, // This stops pagination
        startAt: 50,
        maxResults: 50,
      };

      // Mock board fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBoards,
      });

      // Mock first page of sprints
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSprintsPage1,
      });

      // Mock second page of sprints
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSprintsPage2,
      });

      const result = await client.getSprints("TEST");

      // Should get all sprints from both pages
      expect(result).toEqual([
        ...mockSprintsPage1.values,
        ...mockSprintsPage2.values,
      ]);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Verify pagination calls
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("startAt=0&maxResults=50"),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining("startAt=50&maxResults=50"),
        expect.any(Object)
      );
    });

    it("should return empty array for Kanban boards (no sprints)", async () => {
      const mockBoards = {
        values: [
          {
            id: 456,
            name: "Kanban Board",
            type: "kanban",
            self: "https://test.atlassian.net/rest/agile/1.0/board/456",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBoards,
      });

      const result = await client.getSprints("TEST");

      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      // Should not attempt to fetch sprints from Kanban board
    });

    it("should return empty array when no boards found", async () => {
      const mockBoards = {
        values: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBoards,
      });

      const result = await client.getSprints("TEST");

      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("getIssues", () => {
    it("should fetch issues for sprint successfully with pagination", async () => {
      const mockIssues = {
        issues: [
          {
            id: "issue1",
            key: "PROJ1-1",
            fields: {
              summary: "Test issue",
              issuetype: { name: "Story" },
              status: { name: "In Progress" },
              assignee: { accountId: "user123", displayName: "John Doe" },
              description: "Test description",
            },
          },
        ],
        startAt: 0,
        maxResults: 50,
        total: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockIssues,
      });

      const result = await client.getIssues(1);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/rest/agile/1.0/sprint/1/issue?startAt=0&maxResults=50"
        ),
        expect.any(Object)
      );
      expect(result).toEqual(mockIssues.issues);
    });
  });

  describe("getIssuesByProject", () => {
    it("should fetch issues for project successfully with pagination", async () => {
      const mockIssues = {
        issues: [
          {
            id: "issue1",
            key: "PROJ1-1",
            fields: {
              summary: "Test issue",
              issuetype: { name: "Story" },
              status: { name: "To Do" },
            },
          },
        ],
        startAt: 0,
        maxResults: 50,
        total: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockIssues,
      });

      const result = await client.getIssuesByProject("PROJ1");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/rest/api/3/search?jql=project=PROJ1&startAt=0&maxResults=50"
        ),
        expect.any(Object)
      );
      expect(result).toEqual(mockIssues.issues);
    });
  });

  describe("getIssuesByBoard", () => {
    it("should fetch issues from any board type with pagination", async () => {
      const mockIssues = {
        issues: [
          {
            id: "10001",
            key: "PROJ-1",
            fields: {
              summary: "Test Issue",
              issuetype: { name: "Task" },
              status: { name: "In Progress" },
            },
          },
        ],
        startAt: 0,
        maxResults: 50,
        total: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockIssues,
      });

      const result = await client.getIssuesByBoard(123);

      expect(result).toEqual(mockIssues.issues);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/rest/agile/1.0/board/123/issue?startAt=0&maxResults=50"
        ),
        expect.any(Object)
      );
    });
  });

  describe("getIssuesByProjectBoards", () => {
    it("should handle projects with both Scrum and Kanban boards", async () => {
      const mockBoards = {
        values: [
          {
            id: 123,
            name: "Scrum Board",
            type: "scrum",
            self: "https://test.atlassian.net/rest/agile/1.0/board/123",
          },
          {
            id: 456,
            name: "Kanban Board",
            type: "kanban",
            self: "https://test.atlassian.net/rest/agile/1.0/board/456",
          },
        ],
      };

      const mockScrumIssues = {
        issues: [
          {
            id: "10001",
            key: "PROJ-1",
            fields: {
              summary: "Scrum Issue",
              issuetype: { name: "Story" },
              status: { name: "In Progress" },
            },
          },
        ],
        startAt: 0,
        maxResults: 50,
        total: 1,
      };

      const mockKanbanIssues = {
        issues: [
          {
            id: "10002",
            key: "PROJ-2",
            fields: {
              summary: "Kanban Issue",
              issuetype: { name: "Task" },
              status: { name: "To Do" },
            },
          },
        ],
        startAt: 0,
        maxResults: 50,
        total: 1,
      };

      // Mock board fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBoards,
      });

      // Mock Scrum board issues
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockScrumIssues,
      });

      // Mock Kanban board issues
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockKanbanIssues,
      });

      const result = await client.getIssuesByProjectBoards("PROJ");

      expect(result.scrumBoards).toHaveLength(1);
      expect(result.kanbanBoards).toHaveLength(1);
      expect(result.scrumIssues).toEqual(mockScrumIssues.issues);
      expect(result.kanbanIssues).toEqual(mockKanbanIssues.issues);
      expect(result.allIssues).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should handle projects with only Kanban boards", async () => {
      const mockBoards = {
        values: [
          {
            id: 456,
            name: "Kanban Board",
            type: "kanban",
            self: "https://test.atlassian.net/rest/agile/1.0/board/456",
          },
        ],
      };

      const mockKanbanIssues = {
        issues: [
          {
            id: "10002",
            key: "PROJ-2",
            fields: {
              summary: "Kanban Issue",
              issuetype: { name: "Task" },
              status: { name: "To Do" },
            },
          },
        ],
        startAt: 0,
        maxResults: 50,
        total: 1,
      };

      // Mock board fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBoards,
      });

      // Mock Kanban board issues
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockKanbanIssues,
      });

      const result = await client.getIssuesByProjectBoards("PROJ");

      expect(result.scrumBoards).toHaveLength(0);
      expect(result.kanbanBoards).toHaveLength(1);
      expect(result.scrumIssues).toHaveLength(0);
      expect(result.kanbanIssues).toEqual(mockKanbanIssues.issues);
      expect(result.allIssues).toEqual(mockKanbanIssues.issues);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should deduplicate issues that appear on multiple boards", async () => {
      const mockBoards = {
        values: [
          {
            id: 123,
            name: "Scrum Board",
            type: "scrum",
            self: "https://test.atlassian.net/rest/agile/1.0/board/123",
          },
          {
            id: 456,
            name: "Kanban Board",
            type: "kanban",
            self: "https://test.atlassian.net/rest/agile/1.0/board/456",
          },
        ],
      };

      // Same issue appears on both boards
      const mockDuplicateIssue = {
        id: "10001",
        key: "PROJ-1",
        fields: {
          summary: "Duplicate Issue",
          issuetype: { name: "Story" },
          status: { name: "In Progress" },
        },
      };

      const mockScrumIssues = {
        issues: [mockDuplicateIssue],
        startAt: 0,
        maxResults: 50,
        total: 1,
      };

      const mockKanbanIssues = {
        issues: [mockDuplicateIssue],
        startAt: 0,
        maxResults: 50,
        total: 1,
      };

      // Mock board fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBoards,
      });

      // Mock Scrum board issues
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockScrumIssues,
      });

      // Mock Kanban board issues
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockKanbanIssues,
      });

      const result = await client.getIssuesByProjectBoards("PROJ");

      expect(result.allIssues).toHaveLength(1); // Should be deduplicated
      expect(result.allIssues[0]?.key).toBe("PROJ-1");
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should return empty arrays when no boards exist", async () => {
      const mockBoards = {
        values: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBoards,
      });

      const result = await client.getIssuesByProjectBoards("PROJ");

      expect(result.scrumBoards).toHaveLength(0);
      expect(result.kanbanBoards).toHaveLength(0);
      expect(result.scrumIssues).toHaveLength(0);
      expect(result.kanbanIssues).toHaveLength(0);
      expect(result.allIssues).toHaveLength(0);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
