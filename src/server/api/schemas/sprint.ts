import { z } from "zod";
import { State } from "~/shared/types/State";

export const GetAllSprintsSchema = z.object({
  projectId: z.number().positive().optional(),
  limit: z.number().positive().optional(),
  search: z.string().optional(),
});

export type GetAllSprintsInputType = z.input<typeof GetAllSprintsSchema>;

export const CreateSprintSchema = z.object({
  projectId: z.number().positive(),
  reference: z
    .string()
    .min(1, "Sprint reference cannot be less than 1 characters")
    .max(3, "Sprint reference cannot be more than 3 characters"),
  days: z.number().int().min(1, "Days cannot be less than 1"),
  daysRemaining: z
    .number()
    .int()
    .min(0, "Days remaining cannot be less than 0")
    .optional(),
  state: z.nativeEnum(State).optional().default(State.NOT_STARTED),
  jiraSprintId: z.string().optional(),
});

export type CreateSprintInputType = z.input<typeof CreateSprintSchema>;

export const GetOneSprintSchema = z.object({
  id: z.number().positive(),
  zoomDay: z.number().optional(),
});

export type GetOneSprintInputType = z.input<typeof GetOneSprintSchema>;

export const GetNextSprintSchema = z.object({
  id: z.number().positive(),
});

export type GetNextSprintInputType = z.input<typeof GetNextSprintSchema>;

export const GetPreviousSprintSchema = z.object({
  id: z.number().positive(),
});

export type GetPreviousSprintInputType = z.input<
  typeof GetPreviousSprintSchema
>;

export const GetSprintDeadlinesSchema = z.object({
  sprintId: z.number().positive(),
});

export type GetSprintDeadlinesInputType = z.input<
  typeof GetSprintDeadlinesSchema
>;

export const UnassignSprintTaskSchema = z.object({
  sprintTaskId: z.number().positive(),
});

export type UnassignSprintTaskInputType = z.input<
  typeof UnassignSprintTaskSchema
>;

export const UpdateSprintSchema = z
  .object({
    id: z.number().positive(),
    reference: z
      .string()
      .min(1, "Sprint reference cannot be less than 1 characters")
      .max(3, "Sprint reference cannot be more than 3 characters"),
    days: z.number().int().min(0.25, "Days cannot be less than 0.25"),
    daysRemaining: z
      .number()
      .int()
      .min(0, "Days remaining cannot be less than 0")
      .optional(),
    jiraSprintId: z.string().optional(),
  })
  .refine((data) => (data.daysRemaining ?? 0) <= data.days, {
    message: "Days remaining cannot be more than days",
    path: ["daysRemaining"],
  })
  .refine((data) => data.days >= (data.daysRemaining ?? 0), {
    message: "Days cannot be less than days remaining",
    path: ["days"],
  });

export type UpdateSprintInputType = z.input<typeof UpdateSprintSchema>;

export const UpdateSprintMemberSchema = z.object({
  sprintMemberId: z.number().positive(),
  order: z.number().int().optional(),
  name: z.string().min(3, "Members name cannot be less than 3 characters"),
});

export type UpdateSprintMemberInputType = z.input<
  typeof UpdateSprintMemberSchema
>;

export const GetTasksSchema = z.object({
  sprintId: z.number(),
});

export type GetTasksInputType = z.input<typeof GetTasksSchema>;

export const GetMembersSchema = z.object({
  sprintId: z.number(),
  zoomDay: z.number().optional(),
});

export const DeleteSprintMemberSchema = z.object({
  id: z.number().positive(),
  reason: z
    .string()
    .min(3, "Reason cannot be less than 3 characters")
    .optional(),
});

export type DeleteSprintMemberInputType = z.input<
  typeof DeleteSprintMemberSchema
>;

export const DeleteSprintTaskSchema = z.object({
  id: z.number().positive(),
  reason: z
    .string()
    .min(3, "Reason cannot be less than 3 characters")
    .optional(),
});

export type DeleteSprintTaskInputType = z.input<typeof DeleteSprintTaskSchema>;

export type GetMembersInputType = z.input<typeof GetMembersSchema>;

export const AssignMemberSchema = z.object({
  sprintId: z.number(),
  memberId: z.number(),
});

export type AssignMemberInputType = z.input<typeof AssignMemberSchema>;

export const DeleteSprintSchema = z.object({
  id: z.number().positive(),
  reason: z
    .string()
    .min(3, "Reason cannot be less than 3 characters")
    .optional(),
});

export type DeleteSprintInputType = z.input<typeof DeleteSprintSchema>;

export const GetSprintStateSchema = z.object({
  id: z.number().optional(),
  state: z.nativeEnum(State).optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

export type GetSprintStateInputType = z.input<typeof GetSprintStateSchema>;

export const ProgressSprintSchema = z.object({
  id: z.number().positive(),
  daysRemaining: z.number().optional(),
});

export type ProgressSprintInputType = z.input<typeof ProgressSprintSchema>;

export const CompleteSprintSchema = z.object({
  id: z.number().positive(),
  completedAt: z.date().optional(),
});

export type CompleteSprintInputType = z.input<typeof CompleteSprintSchema>;

export const UpstartSprintSchema = z.object({
  id: z.number().positive(),
  startedAt: z.date().optional(),
});

export type UpstartSprintInputType = z.input<typeof UpstartSprintSchema>;

export const CreateSprintTaskSchema = z.object({
  taskId: z.number().optional(),
  sprintId: z.number().positive(),
  memberId: z.number().optional(),
  memberName: z
    .string()
    .min(3, "Members name cannot be less than 3 characters")
    .optional(),
  addNewAsNewMember: z.boolean().optional().default(false),
  name: z.string().min(3, "Task name cannot be less than 3 characters"),
  description: z.string().optional(),
  state: z.nativeEnum(State).optional().default(State.NOT_STARTED),
  days: z
    .number()
    .refine((value) => !isNaN(Number(value)), "Days must be a number")
    .refine((value) => Number(value) > 0, "Days must be greater than 0")
    .refine(
      (value) => Number(value) % 0.25 === 0,
      "Days must be a multiple of 0.25"
    )
    .refine((value) => Number(value) <= 24, "Days cannot be greater than 24")
    .transform(Number),
  order: z.number().positive().optional(),
});

export type CreateSprintTaskInputType = z.input<typeof CreateSprintTaskSchema>;

export const UpdateSprintTaskSchema = z.object({
  id: z.number().positive(),
  days: z.number().min(0.24, "Days cannot be less than 0.25"),
  state: z.nativeEnum(State).optional().default(State.NOT_STARTED),
  memberId: z.number().optional(),
  memberName: z
    .string()
    .min(3, "Members name cannot be less than 3 characters")
    .optional(),
  sprintId: z.number().positive(),
  description: z.string().optional(),
  reference: z.string().optional(),
  name: z.string().min(3, "Task name cannot be less than 3 characters"),
});

export type UpdateSprintTaskInputType = z.input<typeof UpdateSprintTaskSchema>;

export const GetSprintTasksSchema = z.object({
  sprintId: z.number().positive().optional(),
});

export type GetSprintTasksInputType = z.input<typeof GetSprintTasksSchema>;

export const UpdateSprintTaskOrderSchema = z.object({
  sprintId: z.number().positive(),
  sprintTaskId: z.number().positive(),
  sprintMemberId: z.number().positive(),
  order: z.number().min(0, "Order cannot be less than 0"),
});

export type UpdateSprintTaskOrderInputType = z.input<
  typeof UpdateSprintTaskOrderSchema
>;

export const UpdateSprintMemberOrderSchema = z.object({
  sprintId: z.number().positive(),
  sprintMemberId: z.number().positive(),
  order: z.number().min(0, "Order cannot be less than 0"),
});

export type UpdateSprintMemberOrderInputType = z.input<
  typeof UpdateSprintMemberOrderSchema
>;

export const UpdateSprintNotesSchema = z.object({
  id: z.number().positive(),
  notes: z.string(),
});

export type UpdateSprintNotesInputType = z.input<
  typeof UpdateSprintNotesSchema
>;

export const ManageSprintDeadlineSchema = z.object({
  sprintId: z.number().positive(),
  deadlineId: z.number().positive().optional(),
  day: z.number().positive(),
  name: z.string().min(3, "Name cannot be less than 3 characters"),
  description: z.string().optional(),
  colour: z.string(),
});

export type ManageSprintDeadlineInputType = z.input<
  typeof ManageSprintDeadlineSchema
>;

export const UnassignSprintDeadlineSchema = z.object({
  sprintDeadlineId: z.number().positive(),
});

export type UnassignSprintDeadlineInputType = z.input<
  typeof UnassignSprintDeadlineSchema
>;

export const GetStatsSchema = z.object({
  sprintId: z.number().positive(),
});

export type GetStatsInputType = z.input<typeof GetStatsSchema>;

export const MoveOverrunningTasksSchema = z.object({
  sourceSprintId: z.number().positive(),
  targetSprintId: z.number().positive(),
});

export type MoveOverrunningTasksInputType = z.input<
  typeof MoveOverrunningTasksSchema
>;

export const ReopenSprintSchema = z.object({
  id: z.number().positive(),
  reference: z.string(),
});

export type ReopenSprintInputType = z.input<typeof ReopenSprintSchema>;
