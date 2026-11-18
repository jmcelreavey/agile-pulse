import { type DeleteSprintInputType } from "~/server/api/schemas/sprint";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import {
  UseCase,
  type getInputType,
  type getReturnType,
} from "~/server/logic/useCase";

export class DeleteSprintUseCase extends UseCase {
  async execute(input: DeleteSprintInputType & { deletedRecordId: number }) {
    try {
      const deletedRecord = await this.db.sprint.update({
        where: { id: input.id },
        data: {
          deletedRecordId: input.deletedRecordId,
          sprintMembers: {
            updateMany: {
              where: { sprintId: input.id },
              data: { deletedRecordId: input.deletedRecordId },
            },
          },
          sprintTasks: {
            updateMany: {
              where: { sprintId: input.id },
              data: { deletedRecordId: input.deletedRecordId },
            },
          },
          sprintDeadlines: {
            updateMany: {
              where: { sprintId: input.id },
              data: { deletedRecordId: input.deletedRecordId },
            },
          },
        },
        select: { id: true, projectId: true },
      });

      return deletedRecord;
    } catch (error) {
      console.error(error);
      throw new RecordNotFoundError("Sprint not found");
    }
  }
}

export type DeleteSprintType = getReturnType<DeleteSprintUseCase>;
export type DeleteSprintInput = getInputType<DeleteSprintUseCase>;
