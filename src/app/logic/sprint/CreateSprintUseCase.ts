import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { InvalidateProjectDataUseCase } from "~/app/logic/project/InvalidateProjectDataUseCase";
import { GoToSprintUseCase } from "~/app/logic/sprint/GoToSprintUseCase";
import { UseCase } from "~/app/logic/useCase";
import { type CreateSprintInputType } from "~/server/api/schemas/sprint";
import { api } from "~/trpc/react";

export class CreateSprintUseCase extends UseCase {
  public mutation = api.sprint.create.useMutation();
  protected invalidateProjectData = new InvalidateProjectDataUseCase();
  protected goToSprint = new GoToSprintUseCase();

  public async execute({
    sprint,
    reference,
  }: {
    sprint: CreateSprintInputType;
    reference: string;
  }) {
    try {
      this.setIsMutating(true);
      const record = await this.mutation.mutateAsync(sprint);
      await this.invalidateProjectData.execute();

      ShowNotificationUtil({
        title: `${reference ?? "Record"} created!`,
        message: `sprint ${reference} is now created`,
      });

      this.goToSprint.execute(record.projectId, record.id);
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: `Error creating sprint ${reference}`,
        message: errorMessage,
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
