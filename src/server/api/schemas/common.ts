import { z } from "zod";
import { DeleteSource } from "~/shared/types/DeleteSource";

export const CreateDeleteRecordSchema = z.object({
  reason: z
    .string()
    .min(3, "Reason cannot be less than 3 characters")
    .optional(),
  source: z.nativeEnum(DeleteSource),
  sourceId: z.number(),
});

export type CreateDeleteRecordInputType = z.input<
  typeof CreateDeleteRecordSchema
>;
