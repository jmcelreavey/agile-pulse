import { type GetSprintStateInputType } from "~/server/api/schemas/sprint";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { GetSprintStateUtil } from "~/shared/logic/sprint/GetSprintStateUtil";

export class GetSprintStateUseCase extends UseCase {
  async execute(input: GetSprintStateInputType) {
    const previousState = input.id
      ? await this.db.sprint.findFirst({
          where: { id: input.id },
          select: { state: true },
        })
      : undefined;

    const state = GetSprintStateUtil(
      input.state,
      previousState?.state,
      input.startedAt,
      input.completedAt
    );
    return state;
  }
}

export type GetSprintStateUseCaseType = getReturnType<GetSprintStateUseCase>;
export type GetSprintStateUseCaseInput = Parameters<
  GetSprintStateUseCase["execute"]
>[0];
