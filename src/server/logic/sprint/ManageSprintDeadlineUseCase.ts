import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class ManageSprintDeadlineUseCase extends UseCase {
  async execute(input: {
    deadlineId?: number;
    sprintId: number;
    day: number;
    name: string;
    description?: string;
    colour: string;
  }) {
    const { day, sprintId, deadlineId, ...deadline } = input;

    let deadlineRecord;
    if (deadlineId) {
      deadlineRecord = await this.db.deadline.update({
        where: { id: deadlineId },
        data: deadline,
      });
    } else {
      deadlineRecord = await this.db.deadline.create({
        data: deadline,
      });
    }

    const sprintDeadlineRecord = {
      sprintId,
      day,
      deadlineId: deadlineRecord.id,
    };
    const sprintDeadline = await this.db.sprintDeadline.upsert({
      where: {
        sprintId_day: {
          sprintId: input.sprintId,
          day: input.day,
        },
      },
      create: sprintDeadlineRecord,
      update: sprintDeadlineRecord,
    });

    return sprintDeadline;
  }
}

export type ManageSprintDeadlineUseCaseType =
  getReturnType<ManageSprintDeadlineUseCase>;
export type ManageSprintDeadlineUseCaseInput = Parameters<
  ManageSprintDeadlineUseCase["execute"]
>[0];
