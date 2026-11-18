import { describe, expect, it } from "vitest";
import { fromGitHub, fromJira, jiraStatusToState } from "~/server/integrations/events";
import { hmacSha256Hex, verifySha256Signature } from "~/server/integrations/signature";
import { State } from "~/shared/types/State";

describe("webhook signatures", () => {
  const body = JSON.stringify({ hello: "world" });

  it("accepts a correct sha256 signature and rejects anything else", async () => {
    const signature = `sha256=${await hmacSha256Hex("s3cret", body)}`;
    expect(await verifySha256Signature("s3cret", body, signature)).toBe(true);
    expect(await verifySha256Signature("wrong", body, signature)).toBe(false);
    expect(await verifySha256Signature("s3cret", `${body} `, signature)).toBe(false);
    expect(await verifySha256Signature("s3cret", body, null)).toBe(false);
    expect(await verifySha256Signature("s3cret", body, "sha256=abc")).toBe(false);
    expect(await verifySha256Signature(undefined, body, signature)).toBe(false);
  });

  it("matches GitHub's documented test vector", async () => {
    // https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
    expect(await hmacSha256Hex("It's a Secret to Everybody", "Hello, World!")).toBe(
      "757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17"
    );
  });
});

describe("GitHub events", () => {
  const pr = (action: string, extra: Record<string, unknown> = {}) =>
    fromGitHub("pull_request", {
      action,
      repository: { full_name: "acme/shop" },
      pull_request: { number: 9, html_url: "https://github.com/acme/shop/pull/9", title: "PAY-3 refunds", head: { ref: "pay-3" }, ...extra },
    });

  it("completes the task when a PR merges", () => {
    expect(pr("closed", { merged: true })).toMatchObject({ linkStatus: "merged", taskState: State.COMPLETED, externalId: "acme/shop#9", jiraKeys: ["PAY-3"] });
  });

  it("leaves the task alone when a PR closes unmerged", () => {
    expect(pr("closed", { merged: false })).toMatchObject({ linkStatus: "closed", taskState: null });
  });

  it("moves to QA on review request and starts on open", () => {
    expect(pr("review_requested")?.taskState).toBe(State.WITH_QA);
    expect(pr("opened")?.taskState).toBe(State.IN_PROGRESS);
    expect(pr("synchronize")).toMatchObject({ taskState: null, linkStatus: "open" });
  });

  it("ignores events it doesn't understand", () => {
    expect(fromGitHub("push", {})).toBeNull();
    expect(pr("milestoned")).toBeNull();
  });
});

describe("Jira events", () => {
  it("maps status categories and common names", () => {
    expect(jiraStatusToState("Done", "done")).toBe(State.COMPLETED);
    expect(jiraStatusToState("In Review", "indeterminate")).toBe(State.WITH_QA);
    expect(jiraStatusToState("Blocked", "indeterminate")).toBe(State.BLOCKED);
    expect(jiraStatusToState("To Do", "new")).toBe(State.NOT_STARTED);
  });

  it("reads an issue_updated payload", () => {
    expect(
      fromJira({
        webhookEvent: "jira:issue_updated",
        issue: { key: "PAY-3", self: "https://acme.atlassian.net/rest/api/3/issue/1", fields: { summary: "Refunds", status: { name: "Done", statusCategory: { key: "done" } } } },
      })
    ).toMatchObject({ externalId: "PAY-3", url: "https://acme.atlassian.net/browse/PAY-3", taskState: State.COMPLETED });
    expect(fromJira({ webhookEvent: "comment_created" })).toBeNull();
  });
});
