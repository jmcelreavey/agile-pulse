import { AuthenticatedUseCase } from "~/server/logic/useCase";

interface SaveChangelogInput {
  sprintId: number;
  content: string;
  tone: string;
  taskIds: number[];
  releaseVersion?: string;
}

export class SaveChangelogUseCase extends AuthenticatedUseCase {
  async execute(input: SaveChangelogInput) {
    const { sprintId, content, tone, taskIds, releaseVersion } = input;

    // Verify the sprint exists and user has access
    const sprint = await this.db.sprint.findFirst({
      where: {
        id: sprintId,
        project: {
          domain: this.user.domain,
        },
      },
      include: {
        project: true,
      },
    });

    if (!sprint) {
      throw new Error("Sprint not found or access denied");
    }

    // Always create a new changelog (since we removed the unique constraint)
    const changelog = await this.db.changelog.create({
      data: {
        sprintId,
        content,
        tone,
        taskIds: JSON.stringify(taskIds),
        createdBy: this.user.id,
        version: 1,
        releaseVersion,
        isPublished: false,
      },
    });

    // Update the project's lastReleaseVersion if a releaseVersion is provided
    if (releaseVersion) {
      await this.db.project.update({
        where: { id: sprint.project.id },
        data: {
          lastReleaseVersion: releaseVersion,
        },
      });
    }

    return {
      success: true,
      message: "Changelog saved successfully",
      id: changelog.id,
      version: changelog.version,
      releaseVersion: changelog.releaseVersion,
    };
  }
}
