export enum DeleteSource {
  TASK = "Task",
  SPRINT = "Sprint",
  PROJECT = "Project",
  MEMBER = "Member",
  SPRINT_TASK = "Sprint Task",
  SPRINT_MEMBER = "Sprint Member",
}

export function isDeleteSource(value: string): value is DeleteSource {
  return Object.values(DeleteSource).includes(value as DeleteSource);
}
