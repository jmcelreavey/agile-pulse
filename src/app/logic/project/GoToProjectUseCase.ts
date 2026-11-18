import { UseCase } from "~/app/logic/useCase";

export class GoToProjectUseCase extends UseCase {
  public execute(projectId: number) {
    void this.router.push(`/projects/${projectId}`);
  }
}
