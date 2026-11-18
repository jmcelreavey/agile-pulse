import {
  type GetProjectCommentsForTeamInputType,
  GetProjectCommentsForTeamSchema,
} from "~/server/api/schemas/customer";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import {
  AuthenticatedUseCase,
  type getReturnType,
} from "~/server/logic/useCase";

export class GetProjectCommentsForTeamUseCase extends AuthenticatedUseCase {
  async execute(input: GetProjectCommentsForTeamInputType) {
    // Validate input
    const validatedInput = GetProjectCommentsForTeamSchema.parse(input);

    // Check if project exists and user has access
    const project = await this.db.project.findFirst({
      where: {
        id: validatedInput.projectId,
        domain: this.user.domain,
      },
    });

    if (!project) {
      throw new RecordNotFoundError("Project not found or access denied");
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
        throw new RecordNotFoundError("Sprint not found or access denied");
      }
    }

    // Get all customer comments for this project (both project-level and sprint-level)
    const comments = await this.db.customerComment.findMany({
      where: {
        projectId: validatedInput.projectId,
        // If sprintId is specified, filter to that sprint only, otherwise get all
        ...(validatedInput.sprintId !== undefined && {
          sprintId: validatedInput.sprintId,
        }),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            companyName: true,
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

export type GetProjectCommentsForTeamType =
  getReturnType<GetProjectCommentsForTeamUseCase>;
