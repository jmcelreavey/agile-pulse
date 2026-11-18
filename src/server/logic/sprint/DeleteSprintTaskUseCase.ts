import { type DeleteTaskInputType } from "~/server/api/schemas/task";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import {
  UseCase,
  type getInputType,
  type getReturnType,
} from "~/server/logic/useCase";

export class DeleteSprintTaskUseCase extends UseCase {
  async execute(input: DeleteTaskInputType & { deletedRecordId: number }) {
    try {
      const deletedRecord = await this.db.sprintTask.update({
        where: { id: input.id },
        data: { deletedRecordId: input.deletedRecordId },
        select: { id: true },
      });

      return deletedRecord;
    } catch (error) {
      console.error(error);
      throw new RecordNotFoundError("Task not found");
    }
  }
}

export type DeleteSprintTaskUseCaseType =
  getReturnType<DeleteSprintTaskUseCase>;
export type DeleteSprintTaskUseCaseInput =
  getInputType<DeleteSprintTaskUseCase>;
