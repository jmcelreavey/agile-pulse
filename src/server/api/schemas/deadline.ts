import { z } from "zod";

export const GetAllDeadlinesSchema = z.object({
  projectId: z.number().positive().optional(),
  sprintId: z.number().positive().optional(),
  limit: z.number().positive().optional(),
  search: z.string().optional(),
});

export type GetAllDeadlinesInputType = z.input<typeof GetAllDeadlinesSchema>;
