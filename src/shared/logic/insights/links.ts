import { type LinkStatus } from "~/shared/logic/insights/types";

export type ParsedLink = {
  provider: "github" | "jira";
  kind: "pull_request" | "issue";
  externalId: string;
  url: string;
};

const JIRA_KEY = /\b([A-Z][A-Z0-9]{1,9}-\d{1,6})\b/g;

/** Recognise GitHub pull request and issue URLs and Jira issue URLs or keys. */
export function parseLinkUrl(input: string): ParsedLink | null {
  const value = input.trim();
  const github = /^https?:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+)\/(pull|issues)\/(\d+)/i.exec(value);
  if (github) {
    const [, owner, repo, type, number] = github;
    return {
      provider: "github",
      kind: type?.toLowerCase() === "pull" ? "pull_request" : "issue",
      externalId: `${owner}/${repo}#${number}`,
      url: `https://github.com/${owner}/${repo}/${type?.toLowerCase()}/${number}`,
    };
  }
  const jiraUrl = /^https?:\/\/[\w.-]+\/browse\/([A-Z][A-Z0-9]{1,9}-\d{1,6})/i.exec(value);
  if (jiraUrl?.[1]) {
    return { provider: "jira", kind: "issue", externalId: jiraUrl[1].toUpperCase(), url: value.split(/[?#]/)[0] ?? value };
  }
  return null;
}

/** Jira issue keys mentioned in a PR title, branch or body, e.g. "PAY-104". */
export function findJiraKeys(...texts: (string | null | undefined)[]): string[] {
  const keys = new Set<string>();
  for (const text of texts) {
    for (const match of (text ?? "").toUpperCase().matchAll(JIRA_KEY)) if (match[1]) keys.add(match[1]);
  }
  return [...keys];
}

export const LINK_STATUS_LABEL: Record<LinkStatus, string> = {
  open: "Open",
  draft: "Draft",
  in_review: "In review",
  merged: "Merged",
  closed: "Closed",
  done: "Done",
};
