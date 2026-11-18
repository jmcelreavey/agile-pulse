import { z } from "zod";
import { State } from "~/shared/types/State";

export const CreateProjectSchema = z
  .object({
    name: z.string().min(3, "Project name cannot be less than 3 characters"),
    description: z
      .string()
      .min(3, "Project description cannot be less than 3 characters"),
    colour: z.string().optional(),
    state: z.nativeEnum(State).default(State.NOT_STARTED),
    ticketUrlTemplate: z.string().optional(),
    ticketUrlPrefix: z.string().optional(),
    jiraProjectKey: z.string().optional(),
    jiraProjectId: z.string().optional(),
  })
  .refine(
    (data) =>
      ((data.ticketUrlTemplate ?? "").length > 0 &&
        (data.ticketUrlPrefix ?? "").length > 0) ||
      ((data.ticketUrlTemplate ?? "").length === 0 &&
        (data.ticketUrlPrefix ?? "").length === 0),
    {
      message: "Ticket URL template and prefix must be provided together",
      path: ["ticketUrlPrefix", "ticketUrlTemplate"],
    }
  );

export type CreateProjectInputType = z.input<typeof CreateProjectSchema>;

export const UpdateProjectSchema = z
  .object({
    id: z.number().positive(),
    name: z.string().min(3, "Project name cannot be less than 3 characters"),
    description: z
      .string()
      .min(3, "Project description cannot be less than 3 characters"),
    colour: z.string().optional(),
    state: z.nativeEnum(State).default(State.NOT_STARTED),
    ticketUrlTemplate: z.string().optional(),
    ticketUrlPrefix: z.string().optional(),
    jiraProjectKey: z.string().optional(),
    jiraProjectId: z.string().optional(),
  })
  .refine(
    (data) =>
      ((data.ticketUrlTemplate ?? "").length > 0 &&
        (data.ticketUrlPrefix ?? "").length > 0) ||
      ((data.ticketUrlTemplate ?? "").length === 0 &&
        (data.ticketUrlPrefix ?? "").length === 0),
    {
      message: "Ticket URL template and prefix must be provided together",
      path: ["ticketUrlPrefix", "ticketUrlTemplate"],
    }
  );

export type UpdateProjectInputType = z.input<typeof UpdateProjectSchema>;

export const DeleteProjectSchema = z.object({
  id: z.number().positive(),
  reason: z
    .string()
    .min(3, "Reason cannot be less than 3 characters")
    .optional(),
});

export type DeleteProjectInputType = z.input<typeof DeleteProjectSchema>;

export const CompleteProjectSchema = z.object({
  id: z.number().positive(),
  completedAt: z.date().optional(),
});

export type CompleteProjectInputType = z.input<typeof CompleteProjectSchema>;

export const StartProjectSchema = z.object({
  id: z.number().positive(),
  startedAt: z.date().optional(),
});

export type StartProjectInputType = z.input<typeof StartProjectSchema>;

export const GetOneProjectSchema = z.object({
  id: z.number().positive(),
});

export type GetOneProjectInputType = z.input<typeof GetOneProjectSchema>;

export const GetProjectStateSchema = z.object({
  id: z.number().optional(),
  state: z.nativeEnum(State).optional(),
  completedAt: z.date().optional(),
  startedAt: z.date().optional(),
});

export type GetProjectStateInputType = z.input<typeof GetProjectStateSchema>;

export const UpdateProjectNotesSchema = z.object({
  id: z.number().positive(),
  notes: z.string(),
});

export type UpdateProjectNotesInputType = z.input<
  typeof UpdateProjectNotesSchema
>;

export const UpdateProjectSharedNotesSchema = z.object({
  id: z.number().positive(),
  sharedNotes: z.string(),
});

export type UpdateProjectSharedNotesInputType = z.input<
  typeof UpdateProjectSharedNotesSchema
>;

export const ReopenProjectSchema = z.object({
  id: z.number().positive(),
});

export type ReopenProjectInputType = z.input<typeof ReopenProjectSchema>;
