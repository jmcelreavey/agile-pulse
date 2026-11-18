import {
  UseCase,
  type getInputType,
  type getReturnType,
} from "~/server/logic/useCase";

export class CreateDeleteRecordUseCase extends UseCase {
  async execute(input: { source: string; sourceId: number; reason?: string }) {
    const deletedRecord = await this.db.deleteRecord.create({
      data: {
        ...input,
      },
      select: { id: true },
    });

    return deletedRecord;
  }
}

export type CreateDeleteRecordUseCaseType =
  getReturnType<CreateDeleteRecordUseCase>;
export type CreateDeleteRecordUseCaseInput =
  getInputType<CreateDeleteRecordUseCase>;
