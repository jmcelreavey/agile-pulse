import { type CreateSprintInputType } from "~/server/api/schemas/sprint";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { State } from "~/shared/types/State";

export class CreateSprintUseCase extends UseCase {
  async execute(input: CreateSprintInputType) {
    const daysRemaining = input.daysRemaining ?? input.days;

    let startedAt = undefined;

    if (input.state !== State.NOT_STARTED) {
      startedAt = new Date();
    }

    const sprint = await this.db.sprint.create({
      data: { ...input, daysRemaining, startedAt },
      select: {
        id: true,
        reference: true,
        days: true,
        projectId: true,
        daysRemaining: true,
      },
    });

    return sprint;
  }
}

export type CreateSprintUseCaseType = getReturnType<CreateSprintUseCase>;
export type CreateSprintUseCaseInput = Parameters<
  CreateSprintUseCase["execute"]
>[0];
