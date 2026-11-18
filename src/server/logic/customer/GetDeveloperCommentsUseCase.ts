import {
    type GetDeveloperCommentsInputType,
    GetDeveloperCommentsSchema,
} from "~/server/api/schemas/customer";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { AuthenticatedUseCase, type getReturnType } from "~/server/logic/useCase";

export class GetDeveloperCommentsUseCase extends AuthenticatedUseCase {
  async execute(input: GetDeveloperCommentsInputType) {
    // Validate input
    const validatedInput = GetDeveloperCommentsSchema.parse(input);

    // Check if project exists (developers have general access)
    const project = await this.db.project.findFirst({
      where: {
        id: validatedInput.projectId,
      },
    });

    if (!project) {
      throw new RecordNotFoundError("Project not found");
    }

    // If sprintId is provided, validate it exists and belongs to the project
    if (validatedInput.sprintId) {
      const sprint = await this.db.sprint.findFirst({
        where: {
          id: validatedInput.sprintId,
          projectId: validatedInput.projectId,
        },
      });

      if (!sprint) {
        throw new RecordNotFoundError("Sprint not found");
      }
    }

    // Get all developer comments for this project
    const comments = await this.db.developerComment.findMany({
      where: {
        projectId: validatedInput.projectId,
        // If sprintId is specified, filter to that sprint only, otherwise get all
        ...(validatedInput.sprintId !== undefined && {
          sprintId: validatedInput.sprintId,
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        sprint: {
          select: {
            id: true,
            reference: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return comments;
  }
}

export type GetDeveloperCommentsType = getReturnType<GetDeveloperCommentsUseCase>;
