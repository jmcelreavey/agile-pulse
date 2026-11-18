import { UseCase } from "~/app/logic/useCase";

export class GoToSprintUseCase extends UseCase {
  public execute(projectId: number, sprintId: number) {
    void this.router.push(`/projects/${projectId}/sprints/${sprintId}`, {
      scroll: false,
    });
  }
}
