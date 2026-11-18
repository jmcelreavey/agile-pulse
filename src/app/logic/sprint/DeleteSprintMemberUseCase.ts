import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { GoToProjectUseCase } from "~/app/logic/project/GoToProjectUseCase";
import { InvalidateSprintDataUseCase } from "~/app/logic/sprint/InvalidateSprintDataUseCase";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class DeleteSprintMemberUseCase extends UseCase {
  protected mutation = api.sprint.deleteMember.useMutation();
  protected invalidateSprintDataUseCase = new InvalidateSprintDataUseCase();
  protected goToProjectUseCase = new GoToProjectUseCase();

  public async execute({ id, reference }: { id: number; reference: string }) {
    try {
      this.setIsMutating(true);
      await this.mutation.mutateAsync({
        id,
      });

      await this.invalidateSprintDataUseCase.execute();

      ShowNotificationUtil({
        title: `${reference ?? "Record"} deleted!`,
        message: `sprint member ${reference} is now deleted`,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: `Error archiving sprint member ${reference}`,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
