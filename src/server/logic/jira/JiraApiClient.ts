export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress: string;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
}

export interface JiraBoard {
  id: number;
  name: string;
  type: "scrum" | "kanban";
  self: string;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: "closed" | "active" | "future";
  startDate?: string;
  endDate?: string;
  goal?: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string;
    issuetype: {
      name: string;
    };
    assignee?: {
      accountId: string;
      displayName: string;
    };
    status: {
      name: string;
    };
  };
}

export class JiraApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public shouldRelink = false
  ) {
    super(message);
    this.name = "JiraApiError";
  }
}

export class JiraApiClient {
  private readonly baseUrl: string;
  private readonly accessToken: string;

  constructor(cloudId: string, accessToken: string) {
    this.baseUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
    this.accessToken = accessToken;
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ [JiraApiClient] Request failed: ${response.status} ${response.statusText} - ${errorText}`
      );

      // Determine if user should re-link based on error status and content
      const shouldRelink = this.shouldUserRelink(response.status, errorText);

      const userFriendlyMessage = this.getUserFriendlyErrorMessage(
        response.status,
        errorText
      );

      throw new JiraApiError(
        userFriendlyMessage,
        response.status,
        shouldRelink
      );
    }

    return response.json() as T;
  }

  private shouldUserRelink(status: number, errorText: string): boolean {
    // 401 Unauthorized - token is invalid or expired
    if (status === 401) {
      return true;
    }

    // 403 Forbidden with specific token-related errors
    if (status === 403) {
      const tokenErrors = [
        "invalid_token",
        "expired_token",
        "access_denied",
        "insufficient_scope",
      ];
      return tokenErrors.some((error) =>
        errorText.toLowerCase().includes(error)
      );
    }

    return false;
  }

  private getUserFriendlyErrorMessage(
    status: number,
    errorText: string
  ): string {
    switch (status) {
      case 401:
        return "Your Jira authentication has expired. Please re-link your Jira account in the settings to continue accessing Jira features.";

      case 403:
        if (this.shouldUserRelink(status, errorText)) {
          return "Your Jira access permissions have changed or expired. Please re-link your Jira account in the settings.";
        }
        return "You don't have permission to access this Jira resource. Please check with your Jira administrator or verify the project/sprint still exists.";

      case 404:
        return "The requested Jira resource was not found. The project, sprint, or issue may have been deleted or moved.";

      case 429:
        return "Jira API rate limit exceeded. Please wait a few minutes before trying again.";

      case 500:
      case 502:
      case 503:
      case 504:
        return "Jira service is temporarily unavailable. Please try again in a few minutes.";

      default:
        return `Jira API error (${status}): ${errorText}. If this persists, try re-linking your Jira account.`;
    }
  }

  async getCurrentUser(): Promise<JiraUser> {
    return this.makeRequest<JiraUser>("/rest/api/3/myself");
  }

  async getProjects(): Promise<JiraProject[]> {
    const response = await this.makeRequest<{ values: JiraProject[] }>(
      "/rest/api/3/project/search"
    );
    return response.values;
  }

  async getSprints(projectKey: string): Promise<JiraSprint[]> {
    // First get all boards for the project
    const boardsResponse = await this.makeRequest<{
      values: JiraBoard[];
    }>(`/rest/agile/1.0/board?projectKeyOrId=${projectKey}`);

    if (boardsResponse.values.length === 0) {
      console.log(
        `📋 [JiraApiClient] No boards found for project ${projectKey}`
      );
      return [];
    }

    // Filter to only Scrum boards (only they support sprints)
    const scrumBoards = boardsResponse.values.filter(
      (board) => board.type === "scrum"
    );

    if (scrumBoards.length === 0) {
      console.log(
        `📋 [JiraApiClient] No Scrum boards found for project ${projectKey}. Only Kanban boards exist, which don't support sprints.`
      );
      return [];
    }

    console.log(
      `📋 [JiraApiClient] Found ${
        scrumBoards.length
      } Scrum board(s) for project ${projectKey}. Using board ${
        scrumBoards[0]!.id
      } (${scrumBoards[0]!.name})`
    );

    // Use the first Scrum board to get sprints
    const boardId = scrumBoards[0]!.id;
    try {
      // Fetch ALL sprints (active, future, closed) with proper pagination
      const allSprints: JiraSprint[] = [];
      let startAt = 0;
      const maxResults = 50; // Default page size
      let hasMore = true;

      while (hasMore) {
        // Request all sprint states explicitly and handle pagination
        const sprintsResponse = await this.makeRequest<{
          values: JiraSprint[];
          isLast?: boolean;
          total?: number;
          startAt: number;
          maxResults: number;
        }>(
          `/rest/agile/1.0/board/${boardId}/sprint?state=active,future,closed&startAt=${startAt}&maxResults=${maxResults}`
        );

        allSprints.push(...sprintsResponse.values);

        // Check if we have more sprints to fetch
        hasMore = !sprintsResponse.isLast;
        startAt += maxResults;
      }

      return allSprints;
    } catch (error) {
      // If we get a "board does not support sprints" error, this shouldn't happen now
      // since we're filtering for Scrum boards, but let's handle it gracefully
      if (
        error instanceof JiraApiError &&
        error.message.includes("board does not support sprints")
      ) {
        console.warn(
          `⚠️ [JiraApiClient] Board ${boardId} unexpectedly doesn't support sprints despite being marked as Scrum type`
        );
        return [];
      }
      throw error;
    }
  }

  async getIssues(sprintId: number): Promise<JiraIssue[]> {
    const allIssues: JiraIssue[] = [];
    let startAt = 0;
    const maxResults = 50;
    let hasMore = true;

    while (hasMore) {
      const response = await this.makeRequest<{
        issues: JiraIssue[];
        startAt: number;
        maxResults: number;
        total: number;
      }>(
        `/rest/agile/1.0/sprint/${sprintId}/issue?startAt=${startAt}&maxResults=${maxResults}`
      );

      allIssues.push(...response.issues);
      hasMore =
        response.issues.length === maxResults &&
        allIssues.length < response.total;
      startAt += maxResults;
    }

    return allIssues;
  }

  async getIssuesByProject(projectKey: string): Promise<JiraIssue[]> {
    const allIssues: JiraIssue[] = [];
    let startAt = 0;
    const maxResults = 50;
    let hasMore = true;

    while (hasMore) {
      const response = await this.makeRequest<{
        issues: JiraIssue[];
        startAt: number;
        maxResults: number;
        total: number;
      }>(
        `/rest/api/3/search?jql=project=${projectKey}&startAt=${startAt}&maxResults=${maxResults}`
      );

      allIssues.push(...response.issues);
      hasMore =
        response.issues.length === maxResults &&
        allIssues.length < response.total;
      startAt += maxResults;
    }

    return allIssues;
  }

  /**
   * Gets all issues from a specific board (works for both Scrum and Kanban boards)
   * This is the preferred method for getting issues when you have a board ID
   */
  async getIssuesByBoard(boardId: number): Promise<JiraIssue[]> {
    const allIssues: JiraIssue[] = [];
    let startAt = 0;
    const maxResults = 50;
    let hasMore = true;

    while (hasMore) {
      const response = await this.makeRequest<{
        issues: JiraIssue[];
        startAt: number;
        maxResults: number;
        total: number;
      }>(
        `/rest/agile/1.0/board/${boardId}/issue?startAt=${startAt}&maxResults=${maxResults}`
      );

      allIssues.push(...response.issues);
      hasMore =
        response.issues.length === maxResults &&
        allIssues.length < response.total;
      startAt += maxResults;
    }

    return allIssues;
  }

  /**
   * Gets all boards for a project and then fetches issues from each board.
   * This provides comprehensive issue coverage for projects with mixed board types.
   *
   * Returns an object with:
   * - scrumIssues: Issues from Scrum boards (these can also be organized into sprints)
   * - kanbanIssues: Issues from Kanban boards (these flow through workflow states)
   * - allIssues: Combined issues from all boards
   */
  async getIssuesByProjectBoards(projectKey: string): Promise<{
    scrumIssues: JiraIssue[];
    kanbanIssues: JiraIssue[];
    allIssues: JiraIssue[];
    scrumBoards: JiraBoard[];
    kanbanBoards: JiraBoard[];
  }> {
    // First get all boards for the project
    const boardsResponse = await this.makeRequest<{
      values: JiraBoard[];
    }>(`/rest/agile/1.0/board?projectKeyOrId=${projectKey}`);

    if (boardsResponse.values.length === 0) {
      console.log(
        `📋 [JiraApiClient] No boards found for project ${projectKey}`
      );
      return {
        scrumIssues: [],
        kanbanIssues: [],
        allIssues: [],
        scrumBoards: [],
        kanbanBoards: [],
      };
    }

    // Separate boards by type
    const scrumBoards = boardsResponse.values.filter(
      (board) => board.type === "scrum"
    );
    const kanbanBoards = boardsResponse.values.filter(
      (board) => board.type === "kanban"
    );

    console.log(
      `📋 [JiraApiClient] Found ${scrumBoards.length} Scrum board(s) and ${kanbanBoards.length} Kanban board(s) for project ${projectKey}`
    );

    // Fetch issues from all boards
    const allIssuesPromises: Promise<JiraIssue[]>[] = [];
    const scrumIssuesPromises: Promise<JiraIssue[]>[] = [];
    const kanbanIssuesPromises: Promise<JiraIssue[]>[] = [];

    // Fetch from Scrum boards
    for (const board of scrumBoards) {
      const promise = this.getIssuesByBoard(board.id);
      scrumIssuesPromises.push(promise);
      allIssuesPromises.push(promise);
    }

    // Fetch from Kanban boards
    for (const board of kanbanBoards) {
      const promise = this.getIssuesByBoard(board.id);
      kanbanIssuesPromises.push(promise);
      allIssuesPromises.push(promise);
    }

    // Wait for all requests to complete
    const [scrumIssuesArrays, kanbanIssuesArrays] = await Promise.all([
      Promise.all(scrumIssuesPromises),
      Promise.all(kanbanIssuesPromises),
    ]);

    // Flatten and deduplicate issues (same issue might appear on multiple boards)
    const scrumIssues = this.deduplicateIssues(scrumIssuesArrays.flat());
    const kanbanIssues = this.deduplicateIssues(kanbanIssuesArrays.flat());
    const allIssues = this.deduplicateIssues([...scrumIssues, ...kanbanIssues]);

    console.log(
      `📋 [JiraApiClient] Retrieved ${scrumIssues.length} unique issues from Scrum boards, ${kanbanIssues.length} from Kanban boards, ${allIssues.length} total for project ${projectKey}`
    );

    return {
      scrumIssues,
      kanbanIssues,
      allIssues,
      scrumBoards,
      kanbanBoards,
    };
  }

  /**
   * Removes duplicate issues based on issue key
   */
  private deduplicateIssues(issues: JiraIssue[]): JiraIssue[] {
    const seen = new Set<string>();
    return issues.filter((issue) => {
      if (seen.has(issue.key)) {
        return false;
      }
      seen.add(issue.key);
      return true;
    });
  }
}
