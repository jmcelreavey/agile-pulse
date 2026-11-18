import { UseCase } from "~/app/logic/useCase";
import { GoToSprintUseCase } from "~/app/logic/sprint/GoToSprintUseCase";

export class NavigateSprintUseCase extends UseCase {
  private goToSprint = new GoToSprintUseCase();

  public async execute(props: { toSprintId: number; projectId: number }) {
    void this.goToSprint.execute(props.projectId, props.toSprintId);
  }
}
