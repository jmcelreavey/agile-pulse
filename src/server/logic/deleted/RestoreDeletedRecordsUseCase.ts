import {
  type getInputType,
  type getReturnType,
  AuthenticatedUseCase,
} from "~/server/logic/useCase";
import { type DeleteSource } from "~/shared/types/DeleteSource";

export class RestoreDeletedRecordsUseCase extends AuthenticatedUseCase {
  async execute(input: { source: DeleteSource; id: number }) {
    const removeDeletedRecords = await this.db.deleteRecord.delete({
      where: {
        id: input.id,
      },
    });

    return removeDeletedRecords;
  }
}

export type RestoreDeletedRecordsUseCaseType =
  getReturnType<RestoreDeletedRecordsUseCase>;
export type RestoreDeletedRecordsUseCaseInput =
  getInputType<RestoreDeletedRecordsUseCase>;
