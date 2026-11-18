import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { CreateSprintSnapshotUseCase } from "~/server/logic/snapshot/CreateSprintSnapshotUseCase";
import { GetSprintStateUseCase } from "~/server/logic/sprint/GetSprintStateUseCase";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { SprintSnapShotSource } from "~/shared/types/SnapshotSource";
import { State } from "~/shared/types/State";

export class ProgressSprintUseCase extends UseCase {
  async execute(input: { id: number; daysRemaining?: number }) {
    const sprintSnapshotSource = new CreateSprintSnapshotUseCase(this.db);
    const getSprintState = new GetSprintStateUseCase(this.db);
    const state = await getSprintState.execute({
      id: input.id,
      state: State.IN_PROGRESS,
    });

    const sprint = await this.db.sprint.update({
      where: { id: input.id },
      data: {
        ...state,
        daysRemaining: input.daysRemaining
          ? input.daysRemaining
          : {
              decrement: 1,
            },
      },
      select: {
        id: true,
        reference: true,
        days: true,
        daysRemaining: true,
        state: true,
        projectId: true,
      },
    });

    if (!sprint) {
      throw new RecordNotFoundError("Sprint not found");
    }

    const currentDay = sprint.days - sprint.daysRemaining;
    await sprintSnapshotSource.execute({
      source: SprintSnapShotSource.SPRINT_PROGRESSED,
      sprintId: input.id,
      details: `Sprint Progressed - Day ${currentDay}`,
    });

    return { ...sprint, state };
  }
}

export type ProgressSprintUseCaseType = getReturnType<ProgressSprintUseCase>;
export type ProgressSprintUseCaseInput = Parameters<
  ProgressSprintUseCase["execute"]
>[0];
