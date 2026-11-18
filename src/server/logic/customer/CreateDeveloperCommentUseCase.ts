import {
    type CreateDeveloperCommentInputType,
    CreateDeveloperCommentSchema,
} from "~/server/api/schemas/customer";
import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { AuthenticatedUseCase, type getReturnType } from "~/server/logic/useCase";

export class CreateDeveloperCommentUseCase extends AuthenticatedUseCase {
  async execute(input: CreateDeveloperCommentInputType) {
    // Validate input
    const validatedInput = CreateDeveloperCommentSchema.parse(input);

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

    // Create the developer comment
    const comment = await this.db.developerComment.create({
      data: {
        userId: this.user.id,
        projectId: validatedInput.projectId,
        sprintId: validatedInput.sprintId ?? null,
        content: validatedInput.content,
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
    });

    return comment;
  }
}

export type CreateDeveloperCommentType =
  getReturnType<CreateDeveloperCommentUseCase>;
