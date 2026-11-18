import { type UpstartSprintInputType } from "~/server/api/schemas/sprint";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { CreateSprintSnapshotUseCase } from "~/server/logic/snapshot/CreateSprintSnapshotUseCase";
import { GetSprintStateUseCase } from "~/server/logic/sprint/GetSprintStateUseCase";
import { UseCase, type getReturnType } from "~/server/logic/useCase";
import { SprintSnapShotSource } from "~/shared/types/SnapshotSource";
import { State } from "~/shared/types/State";

export class UpstartSprintUseCase extends UseCase {
  async execute(input: UpstartSprintInputType) {
    const getSprintState = new GetSprintStateUseCase(this.db);
    const state = await getSprintState.execute({
      id: input.id,
      state: State.IN_PROGRESS,
      startedAt: input.startedAt,
    });

    const [sprint] = await Promise.all([
      this.db.sprint.update({
        where: { id: input.id },
        data: {
          ...state,
        },
        select: {
          id: true,
          state: true,
          projectId: true,
        },
      }),
      new CreateSprintSnapshotUseCase(this.db).execute({
        source: SprintSnapShotSource.SPRINT_STARTED,
        sprintId: input.id,
        details: "Sprint Started / Start Date Updated",
      }),
    ]);

    if (!sprint) {
      throw new RecordNotFoundError("Sprint not found");
    }

    return sprint;
  }
}

export type UpstartSprintUseCaseType = getReturnType<UpstartSprintUseCase>;
export type UpstartSprintInput = Parameters<UpstartSprintUseCase["execute"]>[0];
