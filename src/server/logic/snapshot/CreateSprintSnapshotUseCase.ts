import {
  type getInputType,
  type getReturnType,
  UseCase,
} from "~/server/logic/useCase";
import { type SprintSnapShotSource } from "~/shared/types/SnapshotSource";

export class CreateSprintSnapshotUseCase extends UseCase {
  async execute(input: {
    source: SprintSnapShotSource;
    sprintId: number;
    details?: string;
  }) {
    const sprint = await this.db.sprint.findUnique({
      where: { id: input.sprintId },
      include: {
        sprintDeadlines: { include: { deadline: true } },
        sprintMembers: { include: { member: true } },
        sprintTasks: { include: { task: true, sprintMember: true } },
      },
    });

    if (!sprint) {
      throw new Error("Sprint not found");
    }

    // Step 1: Create snapshot and basic sprint
    const cleanSprint = {
      ...sprint,
      sprintDeadlines: undefined,
      sprintMembers: undefined,
      sprintTasks: undefined,
      snapshotId: undefined,
      id: undefined,
    };
    const snapshot = await this.db.snapshot.create({
      data: {
        source: input.source,
        sourceId: input.sprintId,
        details: input.details,
        sprints: {
          create: {
            ...cleanSprint,
          },
        },
      },
      include: {
        sprints: true,
      },
    });

    const newSprint = snapshot.sprints[0];
    const snapshotId = snapshot.id;

    if (!newSprint) {
      throw new Error("Failed to create sprint snapshot");
    }

    // Step 2: Create sprintMembers and keep a mapping of old to new IDs
    const sprintMemberMapping = new Map<number, number>();
    await Promise.all(
      sprint.sprintMembers.map(async (sm) => {
        const newMember = await this.db.member.create({
          data: {
            ...sm.member,
            id: undefined,
            createdAt: undefined,
            updatedAt: undefined,
            snapshotId,
          },
        });
        const newSprintMember = await this.db.sprintMember.create({
          data: {
            ...sm,
            id: undefined,
            createdAt: undefined,
            updatedAt: undefined,
            snapshotId,
            sprintId: newSprint.id,
            memberId: newMember.id,
            member: undefined,
          },
        });
        sprintMemberMapping.set(sm.id, newSprintMember.id);
        return newSprintMember;
      })
    );

    // Step 3: Create sprintDeadlines and sprintTasks
    await this.db.sprint.update({
      where: { id: newSprint.id },
      data: {
        sprintDeadlines: {
          create: sprint.sprintDeadlines.map((sd) => ({
            ...sd,
            deadline: {
              create: {
                ...sd.deadline,
                id: undefined,
                createdAt: undefined,
                updatedAt: undefined,
                snapshotId,
              },
            },
            id: undefined,
            createdAt: undefined,
            updatedAt: undefined,
            snapshot: {
              connect: { id: snapshotId },
            },
            sprintId: undefined,
            snapshotId: undefined,
            deletedRecordId: undefined,
            deadlineId: undefined,
          })),
        },
        sprintTasks: {
          create: sprint.sprintTasks.map((st) => {
            const newSprintMemberId = st.sprintMember
              ? sprintMemberMapping.get(st.sprintMember.id)
              : undefined;
            return {
              ...st,
              id: undefined,
              createdAt: undefined,
              updatedAt: undefined,
              snapshot: {
                connect: { id: snapshotId },
              },
              snapshotId: undefined,
              sprintId: undefined,
              taskId: undefined,
              sprintMemberId: undefined,
              deletedRecordId: undefined,
              task: {
                create: {
                  ...st.task,
                  id: undefined,
                  createdAt: undefined,
                  updatedAt: undefined,
                  snapshotId,
                },
              },
              sprintMember: newSprintMemberId
                ? { connect: { id: newSprintMemberId } }
                : undefined,
            };
          }),
        },
      },
    });

    return snapshot;
  }
}

export type CreateSprintSnapshotUseCaseType =
  getReturnType<CreateSprintSnapshotUseCase>;
export type CreateSprintSnapshotUseCaseInput =
  getInputType<CreateSprintSnapshotUseCase>;
