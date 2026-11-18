import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class GetOneTaskUseCase extends UseCase {
  async execute(input: { id: number }) {
    const task = await this.db.task.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        name: true,
        state: true,
      },
    });

    if (!task) {
      throw new RecordNotFoundError("Task not found");
    }

    return task;
  }
}

export type GetOneTaskUseCaseType = getReturnType<GetOneTaskUseCase>;
export type GetOneTaskInput = Parameters<GetOneTaskUseCase["execute"]>[0];
