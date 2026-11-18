import { z } from "zod";
import { State } from "~/shared/types/State";

export const CreateTaskSchema = z.object({
  name: z.string().min(3, "Task name cannot be less than 3 characters"),
  state: z.nativeEnum(State).optional().default(State.NOT_STARTED),
  days: z.number().positive().min(0.1, "Days cannot be less than 0.1"),
});

export type CreateTaskInputType = z.input<typeof CreateTaskSchema>;

export const DeleteTaskSchema = z.object({
  id: z.number().positive(),
  reason: z
    .string()
    .min(3, "Reason cannot be less than 3 characters")
    .optional(),
});

export type DeleteTaskInputType = z.input<typeof DeleteTaskSchema>;

export const GetOneTaskSchema = z.object({
  id: z.number().positive(),
});

export type GetOneTaskInputType = z.input<typeof GetOneTaskSchema>;

export const GetAllTasksSchema = z.object({
  projectId: z.number().positive().optional(),
  sprintId: z.number().positive().optional(),
  limit: z.number().positive().optional(),
  search: z.string().optional(),
});

export type GetAllTasksInputType = z.input<typeof GetAllTasksSchema>;
