import { z } from "zod";

export const CreateMemberSchema = z.object({
  name: z.string().min(3, "Members name cannot be less than 3 characters"),
});

export type CreateMemberType = z.input<typeof CreateMemberSchema>;

export const UpdateMemberSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(3, "Members name cannot be less than 3 characters"),
});

export type UpdateMemberType = z.input<typeof UpdateMemberSchema>;

export const DeleteMemberSchema = z.object({
  id: z.number().positive(),
  reason: z
    .string()
    .min(3, "Reason cannot be less than 3 characters")
    .optional(),
});

export type DeleteMemberInputType = z.input<typeof DeleteMemberSchema>;

export const GetOneMemberSchema = z.object({
  id: z.number().positive(),
});

export type GetOneMemberInputType = z.input<typeof GetOneMemberSchema>;

export const AssignMemberSchema = z.object({
  sprintId: z.number(),
  memberId: z.number(),
  order: z.number().positive().optional(),
});

export type AssignMemberInputType = z.input<typeof AssignMemberSchema>;

export const GetAllMembersSchema = z.object({
  projectId: z.number().positive().optional(),
  sprintId: z.number().positive().optional(),
  limit: z.number().positive().optional(),
  search: z.string().optional(),
});

export type GetAllMembersInputType = z.input<typeof GetAllMembersSchema>;
