/**
 * Generates a Jira URL from a key (issue key or project key) and connection information
 */
export const GetJiraURLUtil = (props: { key: string; domain?: string }) => {
  const { key, domain } = props;

  if (!key || !domain) {
    return "";
  }

  // Extract the base domain if it includes protocol
  let baseDomain = domain;
  if (domain.includes("://")) {
    baseDomain = domain.split("://")[1] || domain;
  }

  // Remove any trailing slashes
  baseDomain = baseDomain.replace(/\/$/, "");

  // For Jira Cloud, convert company domains to the proper Jira format
  let jiraDomain = baseDomain;
  if (!baseDomain.includes("atlassian.net")) {
    // Extract the company name from the domain (e.g., "acme.com" -> "acme")
    const companyName = baseDomain.split(".")[0];
    if (companyName) {
      jiraDomain = `${companyName}.atlassian.net`;
    }
  }

  return `https://${jiraDomain}/browse/${key}`;
};

/**
 * @deprecated Use GetJiraURLUtil instead
 * Generates a Jira task URL from a Jira issue key and connection information
 */
export const GetJiraTaskURLUtil = (props: {
  jiraIssueKey: string;
  jiraProjectKey?: string;
  domain?: string;
}) => {
  const { jiraIssueKey, jiraProjectKey, domain } = props;

  if (!jiraIssueKey || !jiraProjectKey || !domain) {
    return "";
  }

  return GetJiraURLUtil({
    key: jiraIssueKey,
    domain,
  });
};
