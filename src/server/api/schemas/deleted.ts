import { z } from "zod";
import { DeleteSource } from "~/shared/types/DeleteSource";

export const GetDeletedRecordSchema = z.object({
  source: z.nativeEnum(DeleteSource),
  sourceRelationId: z.number().optional(),
});

export type GetDeletedRecordsInput = z.input<typeof GetDeletedRecordSchema>;

export const RestoreDeletedRecordSchema = z.object({
  source: z.nativeEnum(DeleteSource),
  id: z.number().positive(),
});

export type RestoreDeletedRecordInput = z.input<
  typeof RestoreDeletedRecordSchema
>;
