import { z } from "zod";
import { SprintSnapShotSource } from "~/shared/types/SnapshotSource";

export const GetSprintSnapshotSchema = z.object({
  source: z.nativeEnum(SprintSnapShotSource).optional(),
  sprintId: z.number().positive(),
});

export type GetSprintSnapshotInput = z.input<typeof GetSprintSnapshotSchema>;

export const CreateSprintSnapshotSchema = z.object({
  source: z.nativeEnum(SprintSnapShotSource),
  sprintId: z.number().positive(),
  details: z.string().optional(),
});

export type CreateSprintSnapshotInput = z.input<
  typeof CreateSprintSnapshotSchema
>;
