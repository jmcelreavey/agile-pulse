import { findJiraKeys } from "~/shared/logic/insights/links";
import { type LinkStatus } from "~/shared/logic/insights/types";
import { State } from "~/shared/types/State";

/** What a webhook means for Agile Pulse, independent of which service sent it. */
export type SyncEvent = {
  provider: "github" | "jira";
  kind: "pull_request" | "issue";
  externalId: string;
  url: string | null;
  title: string | null;
  /** Jira keys to match tasks on, from the issue itself or a PR's title and branch. */
  jiraKeys: string[];
  linkStatus: LinkStatus;
  /** New task state, or null to leave the task's state alone. */
  taskState: State | null;
};

type GitHubPullRequest = {
  html_url?: string;
  number?: number;
  title?: string;
  body?: string | null;
  draft?: boolean;
  merged?: boolean;
  head?: { ref?: string };
};

type GitHubPayload = {
  action?: string;
  pull_request?: GitHubPullRequest;
  issue?: { html_url?: string; number?: number; title?: string; body?: string | null; pull_request?: unknown };
  repository?: { full_name?: string };
};

/**
 * Map a GitHub webhook to a sync event. Opening a PR starts the task, asking for review moves it
 * to QA, merging completes it. Closing without merging only updates the link: the work may move to
 * another PR, so the task's state is left for a person to decide.
 */
export function fromGitHub(eventName: string | null, payload: GitHubPayload): SyncEvent | null {
  const repo = payload.repository?.full_name ?? "unknown";
  if (eventName === "pull_request" && payload.pull_request) {
    const pr = payload.pull_request;
    const action = payload.action ?? "";
    let linkStatus: LinkStatus = pr.draft ? "draft" : "open";
    let taskState: State | null = null;
    if (action === "closed") {
      linkStatus = pr.merged ? "merged" : "closed";
      taskState = pr.merged ? State.COMPLETED : null;
    } else if (action === "opened" || action === "reopened") {
      taskState = State.IN_PROGRESS;
    } else if (action === "review_requested" || action === "ready_for_review") {
      linkStatus = "in_review";
      taskState = State.WITH_QA;
    } else if (action === "converted_to_draft") {
      linkStatus = "draft";
      taskState = State.IN_PROGRESS;
    } else if (!["synchronize", "edited", "labeled", "unlabeled", "assigned", "unassigned", "review_request_removed"].includes(action)) {
      return null;
    }
    return {
      provider: "github",
      kind: "pull_request",
      externalId: `${repo}#${pr.number ?? "?"}`,
      url: pr.html_url ?? null,
      title: pr.title ?? null,
      jiraKeys: findJiraKeys(pr.title, pr.head?.ref),
      linkStatus,
      taskState,
    };
  }
  if (eventName === "pull_request_review" && payload.pull_request) {
    const pr = payload.pull_request;
    return {
      provider: "github",
      kind: "pull_request",
      externalId: `${repo}#${pr.number ?? "?"}`,
      url: pr.html_url ?? null,
      title: pr.title ?? null,
      jiraKeys: findJiraKeys(pr.title, pr.head?.ref),
      linkStatus: "in_review",
      taskState: null,
    };
  }
  if (eventName === "issues" && payload.issue && !payload.issue.pull_request) {
    const issue = payload.issue;
    const action = payload.action ?? "";
    if (!["opened", "closed", "reopened", "edited"].includes(action)) return null;
    return {
      provider: "github",
      kind: "issue",
      externalId: `${repo}#${issue.number ?? "?"}`,
      url: issue.html_url ?? null,
      title: issue.title ?? null,
      jiraKeys: findJiraKeys(issue.title),
      linkStatus: action === "closed" ? "done" : "open",
      taskState: action === "closed" ? State.COMPLETED : action === "reopened" ? State.IN_PROGRESS : null,
    };
  }
  return null;
}

type JiraPayload = {
  webhookEvent?: string;
  issue?: {
    key?: string;
    self?: string;
    fields?: { summary?: string; status?: { name?: string; statusCategory?: { key?: string } } };
  };
};

/** Map a Jira status to a task state, by status category with a few common status names. */
export function jiraStatusToState(name: string | undefined, categoryKey: string | undefined): State | null {
  const status = (name ?? "").toLowerCase();
  if (/block|on hold|impediment/.test(status)) return State.BLOCKED;
  if (/qa|test|review|verif/.test(status)) return State.WITH_QA;
  if (/sign[- ]?off|approval|uat/.test(status)) return State.SIGN_OFF_REQUIRED;
  switch (categoryKey) {
    case "done":
      return State.COMPLETED;
    case "indeterminate":
      return State.IN_PROGRESS;
    case "new":
      return State.NOT_STARTED;
    default:
      return null;
  }
}

export function fromJira(payload: JiraPayload): SyncEvent | null {
  const issue = payload.issue;
  if (!issue?.key || !payload.webhookEvent?.startsWith("jira:issue_")) return null;
  if (payload.webhookEvent === "jira:issue_deleted") return null;
  const status = issue.fields?.status;
  const taskState = jiraStatusToState(status?.name, status?.statusCategory?.key);
  const host = issue.self ? new URL(issue.self).origin : null;
  return {
    provider: "jira",
    kind: "issue",
    externalId: issue.key.toUpperCase(),
    url: host ? `${host}/browse/${issue.key}` : null,
    title: issue.fields?.summary ?? null,
    jiraKeys: [issue.key.toUpperCase()],
    linkStatus: taskState === State.COMPLETED ? "done" : "open",
    taskState,
  };
}
