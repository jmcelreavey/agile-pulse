import { SprintSnapshotView } from "~/app/views/lazy";
import { api } from "~/trpc/server";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ sprintId: string; projectId: string }>;
}) {
  const { sprintId: sprintIdString, projectId: projectIdString } = await params;
  const sprintId = Number(sprintIdString);
  const projectId = Number(projectIdString);

  void api.project.getOne.prefetch({ id: projectId });
  void api.sprint.getPrevious.prefetch({ id: sprintId });
  void api.sprint.getNext.prefetch({ id: sprintId });
  void api.snapshot.getSprintSnapshots.prefetch({ sprintId });

  return <SprintSnapshotView sprintId={sprintId} projectId={projectId} />;
}
