import { UseCase } from "~/app/logic/useCase";

export class GoToProjectListUseCase extends UseCase {
  public execute() {
    void this.router.push(`/projects`);
  }
}
