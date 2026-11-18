import { type GetDeletedRecordsUseCaseType } from "~/server/logic/deleted/GetDeletedRecordsUseCase";
import { type GetOneProjectUseCaseType } from "~/server/logic/project/GetOneProjectUseCase";
import { type GetOneSprintUseCaseType } from "~/server/logic/sprint/GetOneSprintUseCase";
import { type GetSprintMembersUseCaseType } from "~/server/logic/sprint/GetSprintMembersUseCase";
import { type GetSprintTasksUseCaseType } from "~/server/logic/sprint/GetSprintTasksUseCase";

export type InitialSprintData = {
  project: GetOneProjectUseCaseType;
  sprint: GetOneSprintUseCaseType;
  sprintTasks: GetSprintTasksUseCaseType;
  sprintMembers: GetSprintMembersUseCaseType;
  deletedTaskRecords: GetDeletedRecordsUseCaseType;
  deletedMemberRecords: GetDeletedRecordsUseCaseType;
};
