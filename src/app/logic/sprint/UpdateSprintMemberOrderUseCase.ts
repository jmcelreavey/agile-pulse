import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToSprintUseCase } from "~/app/logic/sprint/GoToSprintUseCase";
import { InvalidateSprintDataUseCase } from "~/app/logic/sprint/InvalidateSprintDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { type UpdateSprintMemberOrderInputType } from "~/server/api/schemas/sprint";
import { api } from "~/trpc/react";

export class UpdateSprintMemberOrderUseCase extends UseCase {
  protected invalidateSprintData = new InvalidateSprintDataUseCase();
  protected goToSprint = new GoToSprintUseCase();

  public mutation = api.sprint.updateSprintMemberOrder.useMutation();

  public async execute({
    sprintMember,
  }: {
    sprintMember: UpdateSprintMemberOrderInputType;
  }) {
    try {
      this.setIsMutating(true);
      const record = await this.mutation.mutateAsync(sprintMember);

      await this.invalidateSprintData.execute();

      ShowNotificationUtil({
        title: `Sprint member updated!`,
        message: `Member moved.`,
      });

      void this.goToSprint.execute(record.projectId, record.sprintId);
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: `Error moving sprint member ${sprintMember.sprintMemberId}`,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
