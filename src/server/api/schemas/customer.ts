import { z } from "zod";

export const CustomerLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type CustomerLoginInputType = z.input<typeof CustomerLoginSchema>;

export const ValidateInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export type ValidateInvitationInputType = z.input<
  typeof ValidateInvitationSchema
>;

export const AcceptInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  companyName: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type AcceptInvitationInputType = z.input<typeof AcceptInvitationSchema>;

export const AcceptExistingCustomerInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type AcceptExistingCustomerInvitationInputType = z.input<typeof AcceptExistingCustomerInvitationSchema>;

// Invitation management schemas
export const CreateInvitationSchema = z.object({
  projectId: z.number().int().positive("Project ID must be a positive integer"),
  email: z.string().email("Invalid email address"),
});

export type CreateInvitationInputType = z.input<typeof CreateInvitationSchema>;

export const GetProjectInvitationsSchema = z.object({
  projectId: z.number().int().positive("Project ID must be a positive integer"),
});

export type GetProjectInvitationsInputType = z.input<
  typeof GetProjectInvitationsSchema
>;

export const CancelInvitationSchema = z.object({
  invitationId: z
    .number()
    .int()
    .positive("Invitation ID must be a positive integer"),
  projectId: z.number().int().positive("Project ID must be a positive integer"),
});

export type CancelInvitationInputType = z.input<typeof CancelInvitationSchema>;

// Customer project access schemas
export const GetCustomerProjectsSchema = z.object({});

export type GetCustomerProjectsInputType = z.input<
  typeof GetCustomerProjectsSchema
>;

export const GetCustomerProjectDetailsSchema = z.object({
  projectId: z.number().int().positive("Project ID must be a positive integer"),
});

export type GetCustomerProjectDetailsInputType = z.input<
  typeof GetCustomerProjectDetailsSchema
>;

// Customer comment schemas
export const CreateCustomerCommentSchema = z.object({
  projectId: z.number().int().positive("Project ID must be a positive integer"),
  sprintId: z.number().int().positive("Sprint ID must be a positive integer").optional(),
  content: z
    .string()
    .min(1, "Comment content is required")
    .max(2000, "Comment cannot exceed 2000 characters"),
});

export type CreateCustomerCommentInputType = z.input<
  typeof CreateCustomerCommentSchema
>;

export const GetCustomerCommentsSchema = z.object({
  projectId: z.number().int().positive("Project ID must be a positive integer"),
  sprintId: z.number().int().positive("Sprint ID must be a positive integer").optional(),
});

export type GetCustomerCommentsInputType = z.input<
  typeof GetCustomerCommentsSchema
>;

export const DeleteCustomerCommentSchema = z.object({
  commentId: z.number().int().positive("Comment ID must be a positive integer"),
  projectId: z.number().int().positive("Project ID must be a positive integer"),
  sprintId: z.number().int().positive("Sprint ID must be a positive integer").optional(),
});

export type DeleteCustomerCommentInputType = z.input<
  typeof DeleteCustomerCommentSchema
>;

// Team member schemas for viewing customer comments
export const GetProjectCommentsForTeamSchema = z.object({
  projectId: z.number().int().positive("Project ID must be a positive integer"),
  sprintId: z.number().int().positive("Sprint ID must be a positive integer").optional(),
});

export type GetProjectCommentsForTeamInputType = z.input<
  typeof GetProjectCommentsForTeamSchema
>;

// Pending invitations schemas
export const GetCustomerPendingInvitationsSchema = z.object({});

export type GetCustomerPendingInvitationsInputType = z.input<
  typeof GetCustomerPendingInvitationsSchema
>;

export const AcceptInvitationFromDashboardSchema = z.object({
  invitationId: z.number().int().positive("Invitation ID must be a positive integer"),
});

export type AcceptInvitationFromDashboardInputType = z.input<
  typeof AcceptInvitationFromDashboardSchema
>;

export const GetCustomerSprintDetailsSchema = z.object({
  projectId: z.number().int().positive("Project ID must be a positive integer"),
  sprintId: z.number().int().positive("Sprint ID must be a positive integer"),
});

export type GetCustomerSprintDetailsInputType = z.input<typeof GetCustomerSprintDetailsSchema>;

// Customer changelog actions
export const CustomerExportChangelogPdfSchema = z.object({
  projectId: z.number().int().positive("Project ID must be a positive integer"),
  sprintId: z.number().int().positive("Sprint ID must be a positive integer"),
  changelogId: z.number().int().positive("Changelog ID must be a positive integer"),
});

export type CustomerExportChangelogPdfInputType = z.input<typeof CustomerExportChangelogPdfSchema>;

export const CustomerEmailChangelogSchema = z.object({
  projectId: z.number().int().positive("Project ID must be a positive integer"),
  sprintId: z.number().int().positive("Sprint ID must be a positive integer"),
  changelogId: z.number().int().positive("Changelog ID must be a positive integer"),
});

export type CustomerEmailChangelogInputType = z.input<typeof CustomerEmailChangelogSchema>;

// Developer comment schemas
export const CreateDeveloperCommentSchema = z.object({
  projectId: z.number().int().positive("Project ID must be a positive integer"),
  sprintId: z.number().int().positive("Sprint ID must be a positive integer").optional(),
  content: z
    .string()
    .min(1, "Comment content is required")
    .max(2000, "Comment cannot exceed 2000 characters"),
});

export type CreateDeveloperCommentInputType = z.input<
  typeof CreateDeveloperCommentSchema
>;

export const GetDeveloperCommentsSchema = z.object({
  projectId: z.number().int().positive("Project ID must be a positive integer"),
  sprintId: z.number().int().positive("Sprint ID must be a positive integer").optional(),
});

export type GetDeveloperCommentsInputType = z.input<
  typeof GetDeveloperCommentsSchema
>;

export const DeleteDeveloperCommentSchema = z.object({
  commentId: z.number().int().positive("Comment ID must be a positive integer"),
  projectId: z.number().int().positive("Project ID must be a positive integer"),
  sprintId: z.number().int().positive("Sprint ID must be a positive integer").optional(),
});

export type DeleteDeveloperCommentInputType = z.input<
  typeof DeleteDeveloperCommentSchema
>;

// Unified discussion thread schema (for getting both customer and developer comments)
export const GetDiscussionCommentsSchema = z.object({
  projectId: z.number().int().positive("Project ID must be a positive integer"),
  sprintId: z.number().int().positive("Sprint ID must be a positive integer").optional(),
});

export type GetDiscussionCommentsInputType = z.input<
  typeof GetDiscussionCommentsSchema
>;
