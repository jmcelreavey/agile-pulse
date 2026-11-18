import { type getReturnType, UseCase } from "~/server/logic/useCase";
import { type State } from "~/shared/types/State";

export class CreateTaskUseCase extends UseCase {
  async execute(input: { name: string; state: State; description?: string }) {
    const task = await this.db.task.create({
      data: input,
      select: { id: true },
    });

    return task;
  }
}

export type CreateTaskType = getReturnType<CreateTaskUseCase>;
export type CreateTaskInput = Parameters<CreateTaskUseCase["execute"]>[0];
