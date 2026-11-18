import { type UpdateChangelogInputType } from "~/server/api/schemas/changelog";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class UpdateChangelogUseCase extends UseCase {
  async execute(input: UpdateChangelogInputType, userDomain?: string) {
    const { id, ...updateData } = input;

    // Verify the changelog exists and user has access
    const existingChangelog = await this.db.changelog.findFirst({
      where: {
        id,
        sprint: {
          project: {
            domain: userDomain,
          },
        },
      },
      include: {
        sprint: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!existingChangelog) {
      throw new Error("Changelog not found or access denied");
    }

    const updatedChangelog = await this.db.changelog.update({
      where: { id },
      data: {
        ...updateData,
        taskIds: updateData.taskIds
          ? JSON.stringify(updateData.taskIds)
          : undefined,
        updatedAt: new Date(),
      },
      include: {
        sprint: {
          include: {
            project: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updatedChangelog;
  }
}

export type UpdateChangelogUseCaseReturnType =
  getReturnType<UpdateChangelogUseCase>;
