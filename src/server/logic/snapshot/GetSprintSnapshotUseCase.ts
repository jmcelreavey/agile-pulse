import { GetOneSprintUseCase } from "~/server/logic/sprint/GetOneSprintUseCase";
import { GetSprintDeadlinesUseCase } from "~/server/logic/sprint/GetSprintDeadlinesUseCase";
import { GetSprintMembersUseCase } from "~/server/logic/sprint/GetSprintMembersUseCase";
import {
  type getInputType,
  type getReturnType,
  UseCase,
} from "~/server/logic/useCase";
import { type SprintSnapShotSource } from "~/shared/types/SnapshotSource";
import { isState, State } from "~/shared/types/State";

export class GetSprintSnapshotUseCase extends UseCase {
  async execute(input: { source?: SprintSnapShotSource; sprintId: number }) {
    const currentSprint = await this.db.sprint.findUnique({
      where: {
        id: input.sprintId,
      },
    });

    const snapshots = await this.db.snapshot.findMany({
      where: {
        ...((input.source && { source: input.source }) ?? {}),
        sourceId: input.sprintId,
      },
      orderBy: {
        updatedAt: "asc",
      },
      select: {
        id: true,
        details: true,
        updatedAt: true,
        source: true,
        sourceId: true,
        sprints: {
          select: {
            id: true,
            reference: true,
            notes: true,
          },
        },
      },
    });

    const getSprintMembers = new GetSprintMembersUseCase(this.db);
    const getSprintDeadlines = new GetSprintDeadlinesUseCase(this.db);
    const getSprint = new GetOneSprintUseCase(this.db);

    if (!currentSprint) {
      throw new Error("Sprint not found");
    }

    const mockSnapshot: (typeof snapshots)[0] = {
      id: 0,
      details: "Current Day",
      updatedAt: new Date(),
      source: "Current Sprint",
      sourceId: currentSprint.id,
      sprints: [
        {
          id: currentSprint.id,
          reference: currentSprint.reference,
          notes: currentSprint.notes,
        },
      ],
    };

    if (
      isState(currentSprint.state) &&
      currentSprint.state !== State.COMPLETED
    ) {
      // We only want to include this if the sprint is not completed
      snapshots.push(mockSnapshot);
    }

    const results = snapshots.map(async (snapshot) => {
      if (!snapshot.sprints[0] || snapshot.sprints.length === 0) {
        throw new Error("Snapshot is missing sprint");
      }

      if (snapshot.sprints.length > 1) {
        throw new Error("Snapshot has multiple sprints");
      }

      const [sprintMembers, sprintDeadlines, sprint] = await Promise.all([
        getSprintMembers.execute({ sprintId: snapshot.sprints[0].id }),
        getSprintDeadlines.execute({ sprintId: snapshot.sprints[0].id }),
        getSprint.execute({ id: snapshot.sprints[0].id }),
      ]);

      return {
        id: snapshot.id,
        details: snapshot.details ?? undefined,
        updatedAt: snapshot.updatedAt,
        source: snapshot.source,
        sourceId: snapshot.sourceId,
        sprint,
        sprintMembers,
        sprintDeadlines,
      };
    });

    const records = await Promise.all(results);

    return records;
  }
}

export type GetSprintSnapshotUseCaseType =
  getReturnType<GetSprintSnapshotUseCase>;
export type GetSprintSnapshotUseCaseInput =
  getInputType<GetSprintSnapshotUseCase>;
