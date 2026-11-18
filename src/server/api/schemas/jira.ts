import { z } from "zod";

export const LinkJiraAccountSchema = z.object({
  jiraAccountId: z.string().min(1, "Jira account ID is required"),
  jiraAccessToken: z.string().min(1, "Jira access token is required"),
  jiraCloudId: z.string().min(1, "Jira cloud ID is required"),
  fullName: z.string().min(1, "Full name is required"),
});

export const GetJiraProjectsSchema = z.object({
  cloudId: z.string().min(1, "Cloud ID is required"),
});

export const LinkJiraProjectSchema = z.object({
  projectId: z.number().positive("Project ID must be positive"),
  jiraProjectKey: z.string().min(1, "Jira project key is required"),
  jiraProjectId: z.string().min(1, "Jira project ID is required"),
});

export const GetJiraSprintsSchema = z.object({
  projectKey: z.string().min(1, "Project key is required"),
  cloudId: z.string().min(1, "Cloud ID is required"),
});

export const GetJiraSprintIssuesSchema = z.object({
  sprintId: z.number().positive("Sprint ID must be positive"),
  cloudId: z.string().min(1, "Cloud ID is required"),
});

export const SyncJiraSprintSchema = z.object({
  sprintId: z.number().positive("Sprint ID must be positive"),
  jiraSprintId: z.string().min(1, "Jira sprint ID is required"),
  cloudId: z.string().min(1, "Cloud ID is required"),
  overrideExisting: z.boolean().default(false),
});

export const UnlinkJiraProjectSchema = z.object({
  projectId: z.number().positive("Project ID must be positive"),
});

export type LinkJiraAccountInput = z.infer<typeof LinkJiraAccountSchema>;
export type GetJiraProjectsInput = z.infer<typeof GetJiraProjectsSchema>;
export type LinkJiraProjectInput = z.infer<typeof LinkJiraProjectSchema>;
export type GetJiraSprintsInput = z.infer<typeof GetJiraSprintsSchema>;
export type GetJiraSprintIssuesInput = z.infer<
  typeof GetJiraSprintIssuesSchema
>;
export type SyncJiraSprintInput = z.infer<typeof SyncJiraSprintSchema>;
export type UnlinkJiraProjectInput = z.infer<typeof UnlinkJiraProjectSchema>;
