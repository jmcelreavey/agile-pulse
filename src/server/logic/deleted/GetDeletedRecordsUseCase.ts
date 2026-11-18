import {
  type getInputType,
  type getReturnType,
  AuthenticatedUseCase,
} from "~/server/logic/useCase";
import { DeleteSource } from "~/shared/types/DeleteSource";

export class GetDeletedRecordsUseCase extends AuthenticatedUseCase {
  async execute(input: { source: DeleteSource; sourceRelationId?: number }) {
    const deletedRecords = await this.db.deleteRecord.findMany({
      where: {
        source: input.source,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        updatedAt: true,
        reason: true,
        source: true,
        sourceId: true,
        _count: {
          select: {
            members: true,
            projects: true,
            sprints: true,
            tasks: true,
            sprintMembers: true,
            sprintTasks: true,
          },
        },
      },
    });

    const sourceNames = await this.getSourceEntity(
      input.source,
      deletedRecords.map((record) => record.sourceId),
      input.sourceRelationId
    );

    if (sourceNames.length === 0) {
      return [];
    }

    const output = sourceNames.map((record) => {
      const deletedRecord = deletedRecords.find(
        (source) => source.sourceId === record.id
      );

      if (!deletedRecord) {
        throw new Error("Source record not found");
      }

      const counts = deletedRecord._count as Record<string, number>;
      return {
        id: deletedRecord.id,
        deletedAt: deletedRecord.updatedAt,
        reason: deletedRecord.reason,
        source: input.source,
        name: record.name,
        [DeleteSource.MEMBER]: counts.members ?? 0,
        [DeleteSource.PROJECT]: counts.projects ?? 0,
        [DeleteSource.SPRINT]: counts.sprints ?? 0,
        [DeleteSource.TASK]: counts.tasks ?? 0,
        [DeleteSource.SPRINT_MEMBER]: counts.sprintMembers ?? 0,
        [DeleteSource.SPRINT_TASK]: counts.sprintTasks ?? 0,
      };
    });

    return output;
  }

  getSourceEntity = async (
    source: DeleteSource,
    sourceIds: number[],
    sourceRelationId?: number
  ) => {
    switch (source) {
      case DeleteSource.MEMBER: {
        const members = await this.db.member.findMany({
          where: {
            id: {
              in: sourceIds,
            },
            deletedRecordId: {
              not: null,
            },
          },
          select: { name: true, id: true },
        });

        return members.map((member) => {
          return { id: member.id, name: member.name };
        });
      }
      case DeleteSource.PROJECT: {
        const projects = await this.db.project.findMany({
          where: {
            id: {
              in: sourceIds,
            },
            deletedRecordId: {
              not: null,
            },
          },
          select: {
            name: true,
            id: true,
          },
        });

        return projects.map((project) => {
          return { id: project.id, name: project.name };
        });
      }
      case DeleteSource.SPRINT: {
        const sprints = await this.db.sprint.findMany({
          where: {
            id: {
              in: sourceIds,
            },
            deletedRecordId: {
              not: null,
            },
            ...(sourceRelationId
              ? {
                  projectId: sourceRelationId,
                }
              : {}),
          },
          select: { reference: true, id: true },
        });

        return sprints.map((sprint) => {
          return { id: sprint.id, name: sprint.reference };
        });
      }
      case DeleteSource.TASK: {
        const tasks = await this.db.task.findMany({
          where: {
            id: {
              in: sourceIds,
            },
            deletedRecordId: {
              not: null,
            },
          },
          select: { name: true, id: true },
        });

        return tasks.map((task) => {
          return { id: task.id, name: task.name };
        });
      }
      case DeleteSource.SPRINT_MEMBER: {
        const sprintMembers = await this.db.sprintMember.findMany({
          where: {
            id: {
              in: sourceIds,
            },
            deletedRecordId: {
              not: null,
            },
            sprintId: sourceRelationId,
          },
          select: {
            id: true,
            member: {
              select: {
                name: true,
              },
            },
          },
        });

        return sprintMembers.map((sprintMember) => {
          return { id: sprintMember.id, name: sprintMember.member.name };
        });

      }
      case DeleteSource.SPRINT_TASK: {
        const sprintTasks = await this.db.sprintTask.findMany({
          where: {
            id: {
              in: sourceIds,
            },
            deletedRecordId: {
              not: null,
            },
            sprintId: sourceRelationId,
          },
          select: {
            id: true,
            task: {
              select: {
                name: true,
              },
            },
          },
        });

        return sprintTasks.map((sprintTask) => {
          return { id: sprintTask.id, name: sprintTask.task.name };
        });
      }
    }
  };
}

export type GetDeletedRecordsUseCaseType =
  getReturnType<GetDeletedRecordsUseCase>;
export type GetDeletedRecordsUseCaseInput =
  getInputType<GetDeletedRecordsUseCase>;
