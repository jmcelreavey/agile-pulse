import { InternalServerError } from "~/server/errors/InternalServerError";
import { UseCase } from "~/server/logic/useCase";
import {
  generateChangelogContent,
  type ChangelogTone,
  type ProjectContext,
  type TaskData,
} from "~/utils/ai-content-generator";
import { markdownToHtml } from "~/utils/markdown-converter";
import { getNextVersion, isValidVersion } from "~/utils/version-manager";

interface GenerateChangelogInput {
  sprintId: number;
  taskIds: number[];
  tone: ChangelogTone;
  releaseVersion?: string;
}

interface GenerateChangelogOutput {
  content: string;
  generatedAt: Date;
  taskCount: number;
  releaseVersion: string;
}

export class GenerateChangelogUseCase extends UseCase {
  async execute(
    input: GenerateChangelogInput
  ): Promise<GenerateChangelogOutput> {
    const { sprintId, taskIds, tone, releaseVersion } = input;

    try {
      // Get sprint and project information for context
      const sprint = await this.db.sprint.findUnique({
        where: { id: sprintId },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              description: true,
              lastReleaseVersion: true,
            },
          },
        },
      });

      if (!sprint) {
        throw new InternalServerError("Sprint not found");
      }

      // Get the selected tasks with their details
      const sprintTasks = await this.db.sprintTask.findMany({
        where: {
          id: { in: taskIds },
          sprintId: sprintId,
        },
        include: {
          task: {
            select: {
              id: true,
              name: true,
              description: true,
              state: true,
            },
          },
          sprintMember: {
            include: {
              member: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (sprintTasks.length === 0) {
        throw new InternalServerError(
          "No tasks found for the provided task IDs"
        );
      }

      // Transform sprint tasks to the format expected by AI
      const tasks: TaskData[] = sprintTasks.map((sprintTask) => ({
        id: sprintTask.task.id,
        name: sprintTask.task.name,
        description: sprintTask.task.description || "",
        state: sprintTask.task.state,
        assignedTo: sprintTask.sprintMember?.member.name || "Unassigned",
      }));

      // Prepare project context
      const projectContext: ProjectContext = {
        projectName: sprint.project.name,
        projectDescription: sprint.project.description || undefined,
      };

      // Generate changelog content using AI
      const markdownContent = await generateChangelogContent({
        tasks,
        tone,
        projectContext,
      });

      // Convert markdown to HTML for rich text editor
      const htmlContent = markdownToHtml(markdownContent);

      // Determine the release version
      let finalReleaseVersion = releaseVersion;
      if (!finalReleaseVersion) {
        const currentVersion = sprint.project.lastReleaseVersion;

        if (currentVersion && isValidVersion(currentVersion)) {
          finalReleaseVersion = getNextVersion(currentVersion);
        } else {
          finalReleaseVersion = "0.0.1";
        }
      } else {
        if (!isValidVersion(finalReleaseVersion)) {
          throw new InternalServerError(
            `Invalid release version format: ${finalReleaseVersion}. Expected format: "major.minor.patch"`
          );
        }
      }

      return {
        content: htmlContent,
        generatedAt: new Date(),
        taskCount: tasks.length,
        releaseVersion: finalReleaseVersion,
      };
    } catch (error) {
      if (error instanceof InternalServerError) {
        throw error;
      }
      console.error("Error generating changelog:", error);
      throw new InternalServerError(
        "Failed to generate changelog. Please try again."
      );
    }
  }
}

export type GenerateChangelogUseCaseOutput = GenerateChangelogOutput;
