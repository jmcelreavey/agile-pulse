import { type DeleteProjectInputType } from "~/server/api/schemas/project";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import {
  UseCase,
  type getInputType,
  type getReturnType,
} from "~/server/logic/useCase";

export class DeleteProjectUseCase extends UseCase {
  async execute(input: DeleteProjectInputType & { deletedRecordId: number }) {
    try {
      const sprintRecords = await this.db.sprint.findMany({
        where: { projectId: input.id },
      });

      const transactionOperations = [];

      if (sprintRecords.length > 0) {
        for (const sprint of sprintRecords) {
          transactionOperations.push(
            this.db.sprint.update({
              where: { id: sprint.id },
              data: {
                deletedRecordId: input.deletedRecordId,
                sprintMembers: {
                  updateMany: {
                    where: { sprintId: sprint.id },
                    data: { deletedRecordId: input.deletedRecordId },
                  },
                },
                sprintTasks: {
                  updateMany: {
                    where: { sprintId: sprint.id },
                    data: { deletedRecordId: input.deletedRecordId },
                  },
                },
                sprintDeadlines: {
                  updateMany: {
                    where: { sprintId: sprint.id },
                    data: { deletedRecordId: input.deletedRecordId },
                  },
                },
              },
            })
          );
        }
      }

      transactionOperations.push(
        this.db.project.update({
          where: { id: input.id },
          data: {
            deletedRecordId: input.deletedRecordId,
          },
          select: { id: true },
        })
      );

      const [deletedRecord] = await this.db.$transaction(transactionOperations);

      return deletedRecord;
    } catch (error) {
      console.error(error);
      throw new RecordNotFoundError("Project not found");
    }
  }
}

export type DeleteProjectType = getReturnType<DeleteProjectUseCase>;
export type DeleteProjectInput = getInputType<DeleteProjectUseCase>;
