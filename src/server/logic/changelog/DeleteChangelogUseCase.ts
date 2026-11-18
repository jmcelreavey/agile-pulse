import { type DeleteChangelogInputType } from "~/server/api/schemas/changelog";
import { UseCase, type getReturnType } from "~/server/logic/useCase";

export class DeleteChangelogUseCase extends UseCase {
  async execute(input: DeleteChangelogInputType, userDomain?: string) {
    // Verify the changelog exists and user has access
    const existingChangelog = await this.db.changelog.findFirst({
      where: {
        id: input.id,
        sprint: {
          project: {
            domain: userDomain,
          },
        },
      },
    });

    if (!existingChangelog) {
      throw new Error("Changelog not found or access denied");
    }

    await this.db.changelog.delete({
      where: { id: input.id },
    });

    return { success: true, message: "Changelog deleted successfully" };
  }
}

export type DeleteChangelogUseCaseReturnType =
  getReturnType<DeleteChangelogUseCase>;
