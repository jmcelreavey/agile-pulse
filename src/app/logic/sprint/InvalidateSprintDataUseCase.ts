import { UseCase } from "~/app/logic/useCase";

export class InvalidateSprintDataUseCase extends UseCase {
  public async execute() {
    void this.useUtils.deleted.getDeletedRecords.invalidate();
    void this.useUtils.sprint.getTasks.invalidate();
    void this.useUtils.sprint.getOne.invalidate();
    void this.useUtils.sprint.getMembers.invalidate();
    void this.useUtils.sprint.getDeadlines.invalidate();
    void this.useUtils.project.getOne.invalidate();
    void this.useUtils.sprint.getAll.invalidate();
    void this.useUtils.deadline.getAll.invalidate();
    void this.useUtils.task.getAll.invalidate();
    void this.useUtils.snapshot.getSprintSnapshots.invalidate();
    void this.useUtils.sprint.getMemberMetrics.invalidate();
    void this.useUtils.sprint.getMetrics.invalidate();
    void this.useUtils.insights.invalidate();
  }
}
