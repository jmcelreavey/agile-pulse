import { type GetDeletedRecordsUseCaseType } from "~/server/logic/deleted/GetDeletedRecordsUseCase";
import { type GetAllProjectsType } from "~/server/logic/project/GetAllProjectsUseCase";
import { type GetOneProjectUseCaseType } from "~/server/logic/project/GetOneProjectUseCase";
import { type GetProjectSprintsUseCaseType } from "~/server/logic/project/GetProjectSprintsUseCase";

export type InitialProjectData = {
  project: GetOneProjectUseCaseType;
  sprints: GetProjectSprintsUseCaseType;
  deletedRecords: GetDeletedRecordsUseCaseType;
};

export type InitialProjectListData = {
  projects: GetAllProjectsType;
  deletedRecords: GetDeletedRecordsUseCaseType;
};
