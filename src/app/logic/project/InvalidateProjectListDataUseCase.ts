import { UseCase } from "~/app/logic/useCase";

export class InvalidateProjectListDataUseCase extends UseCase {
  public async execute() {
    void this.useUtils.deleted.getDeletedRecords.invalidate();
    void this.useUtils.project.getAll.invalidate();
  }
}
