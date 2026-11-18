import { type GetSharingHistoryInputType } from "~/server/api/schemas/changelog";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class GetSharingHistoryUseCase extends UseCase {
  async execute(input: GetSharingHistoryInputType, userDomain?: string) {
    // Verify access to the changelog
    const changelog = await this.db.changelog.findFirst({
      where: {
        id: input.changelogId,
        sprint: {
          project: {
            domain: userDomain,
          },
        },
      },
    });

    if (!changelog) {
      throw new Error("Changelog not found or access denied");
    }

    const sharingHistory = await this.db.changelogSharing.findMany({
      where: { changelogId: input.changelogId },
      include: {
        customer: true,
        sharedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return sharingHistory;
  }
}

export type GetSharingHistoryUseCaseReturnType =
  getReturnType<GetSharingHistoryUseCase>;
