import { type CompleteSprintInputType } from "~/server/api/schemas/sprint";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { CreateSprintSnapshotUseCase } from "~/server/logic/snapshot/CreateSprintSnapshotUseCase";
import { GetSprintStateUseCase } from "~/server/logic/sprint/GetSprintStateUseCase";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { SprintSnapShotSource } from "~/shared/types/SnapshotSource";
import { State } from "~/shared/types/State";

export class CompleteSprintUseCase extends UseCase {
  async execute(input: CompleteSprintInputType) {
    const getSprintState = new GetSprintStateUseCase(this.db);
    const sprintSnapshotSource = new CreateSprintSnapshotUseCase(this.db);
    const state = await getSprintState.execute({
      id: input.id,
      state: State.COMPLETED,
      completedAt: input.completedAt,
    });

    const sprint = await this.db.sprint.update({
      where: { id: input.id },
      data: {
        ...state,
      },
      select: {
        id: true,
        projectId: true,
        state: true,
        days: true,
        daysRemaining: true,
      },
    });

    if (!sprint) {
      throw new RecordNotFoundError("Sprint not found");
    }

    const currentDay = sprint.days - sprint.daysRemaining;
    await sprintSnapshotSource.execute({
      source: SprintSnapShotSource.SPRINT_COMPLETED,
      sprintId: input.id,
      details: `Sprint Completed - Day ${currentDay}`,
    });

    return sprint;
  }
}

export type CompleteSprintUseCaseType = getReturnType<CompleteSprintUseCase>;
export type CompleteSprintInput = Parameters<
  CompleteSprintUseCase["execute"]
>[0];
