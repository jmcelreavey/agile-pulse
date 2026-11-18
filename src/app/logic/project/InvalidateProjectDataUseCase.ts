import { UseCase } from "~/app/logic/useCase";

export class InvalidateProjectDataUseCase extends UseCase {
  public async execute() {
    void this.useUtils.deleted.getDeletedRecords.invalidate();
    void this.useUtils.project.getSprints.invalidate();
    void this.useUtils.project.getOne.invalidate();
  }
}
