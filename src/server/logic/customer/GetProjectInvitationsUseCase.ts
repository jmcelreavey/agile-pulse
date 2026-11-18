import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import {
  AuthenticatedUseCase,
  type getReturnType,
} from "~/server/logic/useCase";

export class GetProjectInvitationsUseCase extends AuthenticatedUseCase {
  async execute(input: { projectId: number }) {
    // Verify project exists and user has access
    const project = await this.db.project.findFirst({
      where: {
        id: input.projectId,
        domain: this.user.domain,
      },
    });

    if (!project) {
      throw new RecordNotFoundError("Project not found or access denied");
    }

    // Get all invitations for this project
    const invitations = await this.db.customerInvitation.findMany({
      where: {
        projectId: input.projectId,
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // pending first, then accepted, then expired
        { createdAt: "desc" },
      ],
    });

    return invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      invitedBy: invitation.invitedBy,
      customer: invitation.customer,
    }));
  }
}

export type GetProjectInvitationsType =
  getReturnType<GetProjectInvitationsUseCase>;
export type GetProjectInvitationsInput = Parameters<
  GetProjectInvitationsUseCase["execute"]
>[0];
