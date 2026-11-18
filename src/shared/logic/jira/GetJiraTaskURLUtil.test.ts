import { describe, expect, it } from "vitest";
import {
  GetJiraTaskURLUtil,
  GetJiraURLUtil,
} from "~/shared/logic/jira/GetJiraTaskURLUtil";

describe("GetJiraURLUtil", () => {
  it("should generate correct Jira URL with domain", () => {
    const result = GetJiraURLUtil({
      key: "PROJECT-123",
      domain: "mycompany.atlassian.net",
    });

    expect(result).toBe("https://mycompany.atlassian.net/browse/PROJECT-123");
  });

  it("should handle domain with protocol", () => {
    const result = GetJiraURLUtil({
      key: "TEST",
      domain: "https://example.atlassian.net",
    });

    expect(result).toBe("https://example.atlassian.net/browse/TEST");
  });

  it("should handle domain with trailing slash", () => {
    const result = GetJiraURLUtil({
      key: "TASK",
      domain: "company.atlassian.net/",
    });

    expect(result).toBe("https://company.atlassian.net/browse/TASK");
  });

  it("should convert company domain to Jira Cloud format", () => {
    const result = GetJiraURLUtil({
      key: "DEMO",
      domain: "acme.com",
    });

    expect(result).toBe("https://acme.atlassian.net/browse/DEMO");
  });

  it("should return empty string when key is missing", () => {
    const result = GetJiraURLUtil({
      key: "",
      domain: "mycompany.atlassian.net",
    });

    expect(result).toBe("");
  });

  it("should return empty string when domain is missing", () => {
    const result = GetJiraURLUtil({
      key: "PROJECT",
      domain: "",
    });

    expect(result).toBe("");
  });
});

describe("GetJiraTaskURLUtil", () => {
  it("should generate correct Jira URL with domain", () => {
    const result = GetJiraTaskURLUtil({
      jiraIssueKey: "PROJECT-123",
      jiraProjectKey: "PROJECT",
      domain: "mycompany.atlassian.net",
    });

    expect(result).toBe("https://mycompany.atlassian.net/browse/PROJECT-123");
  });

  it("should handle domain with protocol", () => {
    const result = GetJiraTaskURLUtil({
      jiraIssueKey: "TEST-456",
      jiraProjectKey: "TEST",
      domain: "https://example.atlassian.net",
    });

    expect(result).toBe("https://example.atlassian.net/browse/TEST-456");
  });

  it("should handle domain with trailing slash", () => {
    const result = GetJiraTaskURLUtil({
      jiraIssueKey: "TASK-789",
      jiraProjectKey: "TASK",
      domain: "company.atlassian.net/",
    });

    expect(result).toBe("https://company.atlassian.net/browse/TASK-789");
  });

  it("should convert company domain to Jira Cloud format", () => {
    const result = GetJiraTaskURLUtil({
      jiraIssueKey: "DEMO-460",
      jiraProjectKey: "DEMO",
      domain: "acme.com",
    });

    expect(result).toBe("https://acme.atlassian.net/browse/DEMO-460");
  });

  it("should handle company domain with protocol", () => {
    const result = GetJiraTaskURLUtil({
      jiraIssueKey: "PROJ-123",
      jiraProjectKey: "PROJ",
      domain: "https://mycompany.com",
    });

    expect(result).toBe("https://mycompany.atlassian.net/browse/PROJ-123");
  });

  it("should not modify domain if already atlassian.net", () => {
    const result = GetJiraTaskURLUtil({
      jiraIssueKey: "TEST-456",
      jiraProjectKey: "TEST",
      domain: "mycompany.atlassian.net",
    });

    expect(result).toBe("https://mycompany.atlassian.net/browse/TEST-456");
  });

  it("should return empty string when jiraIssueKey is missing", () => {
    const result = GetJiraTaskURLUtil({
      jiraIssueKey: "",
      jiraProjectKey: "PROJECT",
      domain: "mycompany.atlassian.net",
    });

    expect(result).toBe("");
  });

  it("should return empty string when jiraProjectKey is missing", () => {
    const result = GetJiraTaskURLUtil({
      jiraIssueKey: "PROJECT-123",
      jiraProjectKey: "",
      domain: "mycompany.atlassian.net",
    });

    expect(result).toBe("");
  });

  it("should return empty string when domain is missing", () => {
    const result = GetJiraTaskURLUtil({
      jiraIssueKey: "PROJECT-123",
      jiraProjectKey: "PROJECT",
      domain: "",
    });

    expect(result).toBe("");
  });
});
