export type SnapshotSource = SprintSnapShotSource;

export enum SprintSnapShotSource {
  SPRINT_STARTED = "Sprint Started",
  SPRINT_PROGRESSED = "Progressed Sprint",
  SPRINT_COMPLETED = "Completed Sprint",
}

export function isSnapshotSource(value: string): value is SnapshotSource {
  return Object.values(SprintSnapShotSource).includes(value as SnapshotSource);
}
