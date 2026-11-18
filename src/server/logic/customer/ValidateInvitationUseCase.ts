import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class ValidateInvitationUseCase extends UseCase {
  async execute(input: { token: string }) {
    const invitation = await this.db.customerInvitation.findUnique({
      where: {
        token: input.token,
        status: "pending",
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new RecordNotFoundError("Invitation not found or already used");
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      // Update status to expired
      await this.db.customerInvitation.update({
        where: { id: invitation.id },
        data: { status: "expired" },
      });
      throw new RecordNotFoundError("Invitation has expired");
    }

    return {
      id: invitation.id,
      email: invitation.email,
      projectId: invitation.projectId,
      project: invitation.project,
      expiresAt: invitation.expiresAt,
    };
  }
}

export type ValidateInvitationType = getReturnType<ValidateInvitationUseCase>;
export type ValidateInvitationInput = Parameters<
  ValidateInvitationUseCase["execute"]
>[0];
