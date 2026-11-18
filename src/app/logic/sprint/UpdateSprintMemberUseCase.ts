import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToSprintUseCase } from "~/app/logic/sprint/GoToSprintUseCase";
import { InvalidateSprintDataUseCase } from "~/app/logic/sprint/InvalidateSprintDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { type UpdateSprintMemberInputType } from "~/server/api/schemas/sprint";
import { api } from "~/trpc/react";

export class UpdateSprintMemberUseCase extends UseCase {
  public mutation = api.sprint.updateMember.useMutation();
  protected invalidateSprintData = new InvalidateSprintDataUseCase();
  protected goToSprint = new GoToSprintUseCase();

  public async execute({
    sprintMember,
    reference,
  }: {
    sprintMember: UpdateSprintMemberInputType;
    reference: string;
  }) {
    try {
      this.setIsMutating(true);
      const record = await this.mutation.mutateAsync(sprintMember);

      await this.invalidateSprintData.execute();

      ShowNotificationUtil({
        title: `${reference ?? "Record"} updated!`,
        message: `sprint member ${reference} is now updated`,
      });

      void this.goToSprint.execute(record.projectId, record.sprintId);
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: `Error updating sprint member ${reference}`,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
