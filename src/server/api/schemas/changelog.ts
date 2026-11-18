import { z } from "zod";

export const ChangelogToneSchema = z.enum(["formal", "informal", "technical"]);

export const GenerateChangelogSchema = z.object({
  sprintId: z.number().positive(),
  taskIds: z
    .array(z.number().positive())
    .min(1, "At least one task must be selected"),
  tone: ChangelogToneSchema.default("technical"),
  releaseVersion: z.string().optional(), // Optional override for release version
});

export const SaveChangelogSchema = z.object({
  sprintId: z.number().positive(),
  projectId: z.number().positive(),
  content: z.string().min(1, "Changelog content is required"),
  taskIds: z.array(z.number().positive()),
  tone: ChangelogToneSchema,
  title: z.string().min(1, "Changelog title is required").optional(),
  releaseVersion: z.string().optional(), // Optional release version
});

export const ExportChangelogSchema = z.object({
  changelogId: z.number().positive(),
  format: z.enum(["pdf", "markdown"]).default("pdf"),
});

export const ShareChangelogEmailSchema = z.object({
  sprintId: z.number().positive(),
  content: z.string().min(1, "Changelog content is required"),
  customerIds: z
    .array(z.number().positive())
    .min(1, "At least one customer must be selected"),
  projectName: z.string().min(1, "Project name is required"),
  sprintName: z.string().min(1, "Sprint name is required"),
});

export const ExportChangelogPdfSchema = z.object({
  sprintId: z.number().positive(),
  content: z.string().min(1, "Changelog content is required"),
  projectName: z.string().min(1, "Project name is required"),
  sprintName: z.string().min(1, "Sprint name is required"),
});

export const ShareChangelogSchema = z
  .object({
    sprintId: z.number().positive(),
    content: z.string().min(1, "Changelog content is required"),
    projectName: z.string().min(1, "Project name is required"),
    sprintName: z.string().min(1, "Sprint name is required"),
    emailCustomers: z.boolean(),
    exportPdf: z.boolean(),
    customerIds: z.array(z.number().positive()).optional(),
  })
  .refine((data) => data.emailCustomers || data.exportPdf, {
    message: "At least one sharing option (email or PDF) must be selected",
    path: ["emailCustomers"],
  })
  .refine(
    (data) =>
      !data.emailCustomers || (data.customerIds && data.customerIds.length > 0),
    {
      message: "Customer IDs are required when email sharing is enabled",
      path: ["customerIds"],
    }
  );

// CRUD schemas
export const GetOneChangelogSchema = z
  .object({
    id: z.number().positive().optional(),
    sprintId: z.number().positive().optional(),
  })
  .refine((data) => data.id || data.sprintId, {
    message: "Either id or sprintId must be provided",
  });

export const GetAllChangelogsSchema = z.object({
  projectId: z.number().positive().optional(),
  sprintId: z.number().positive().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  isPublished: z.boolean().optional(),
  domain: z.string().optional(),
});

export const UpdateChangelogSchema = z.object({
  id: z.number().positive(),
  content: z.string().optional(),
  tone: ChangelogToneSchema.optional(),
  isPublished: z.boolean().optional(),
  taskIds: z.array(z.number().positive()).optional(),
  releaseVersion: z.string().optional(),
});

export const DeleteChangelogSchema = z.object({
  id: z.number().positive(),
});

export const GetSharingHistorySchema = z.object({
  changelogId: z.number().positive(),
});

// Type exports
export type GenerateChangelogInputType = z.input<
  typeof GenerateChangelogSchema
>;
export type SaveChangelogInputType = z.input<typeof SaveChangelogSchema>;
export type ShareChangelogInputType = z.input<typeof ShareChangelogSchema>;
export type ExportChangelogInputType = z.input<typeof ExportChangelogSchema>;
export type GetOneChangelogInputType = z.input<typeof GetOneChangelogSchema>;
export type GetAllChangelogsInputType = z.input<typeof GetAllChangelogsSchema>;
export type UpdateChangelogInputType = z.input<typeof UpdateChangelogSchema>;
export type DeleteChangelogInputType = z.input<typeof DeleteChangelogSchema>;
export type GetSharingHistoryInputType = z.input<
  typeof GetSharingHistorySchema
>;
