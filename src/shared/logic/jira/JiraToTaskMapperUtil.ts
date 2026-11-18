import { type JiraUser } from "~/server/logic/jira/JiraApiClient";
import { State } from "~/shared/types/State";

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

export interface JiraTaskData {
  name: string;
  description: string | null;
  state: State;
  jiraIssueKey: string;
  jiraIssueId: string;
  jiraIssueType: string;
}

/**
 * Maps a Jira issue to task data structure
 */
export const mapJiraIssueToTask = (issue: JiraIssue): JiraTaskData => {
  return {
    name: `${issue.key}: ${issue.fields.summary}`,
    description: issue.fields.description || null,
    state: mapJiraStatusToState(issue.fields.status.name),
    jiraIssueKey: issue.key,
    jiraIssueId: issue.id,
    jiraIssueType: issue.fields.issuetype.name,
  };
};

/**
 * Maps a Jira status to internal state enum
 */
export const mapJiraStatusToState = (jiraStatus: string): State => {
  const normalizedStatus = jiraStatus.toLowerCase();

  // Common Jira status mappings - most specific first
  if (
    normalizedStatus.includes("done") ||
    normalizedStatus.includes("closed") ||
    normalizedStatus.includes("resolved") ||
    normalizedStatus.includes("complete")
  ) {
    return State.COMPLETED;
  }

  if (
    normalizedStatus.includes("progress") ||
    normalizedStatus.includes("development") ||
    normalizedStatus.includes("review")
  ) {
    return State.IN_PROGRESS;
  }

  if (normalizedStatus.includes("qa") || normalizedStatus.includes("testing")) {
    return State.WITH_QA;
  }

  if (normalizedStatus.includes("blocked")) {
    return State.BLOCKED;
  }

  if (normalizedStatus.includes("risk")) {
    return State.AT_RISK;
  }

  // Default to NOT_STARTED for "to do", "new", "open", "backlog", etc.
  return State.NOT_STARTED;
};

/**
 * Extracts unique Jira users from a list of Jira issues
 */
export const extractUniqueJiraUsers = (jiraIssues: JiraIssue[]) => {
  const usersMap = new Map<string, JiraUser>();

  jiraIssues.forEach((issue) => {
    if (issue.fields.assignee) {
      const user = {
        accountId: issue.fields.assignee.accountId,
        displayName: issue.fields.assignee.displayName,
        emailAddress: "", // Jira issues don't include email
      };
      usersMap.set(user.accountId, user);
    }
  });

  return Array.from(usersMap.values());
};
