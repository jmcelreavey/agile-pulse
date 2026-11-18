import type { Metadata } from "next";
import { ChangelogListView } from "~/app/views/lazy";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Project Changelogs - Agile Pulse",
  description: "Manage changelogs for this project",
};

export default async function ProjectChangelogsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId: projectIdString } = await params;
  const projectId = Number(projectIdString);

  // Prefetch project data and changelogs
  void api.project.getOne.prefetch({ id: projectId });
  void api.changelog.getAll.prefetch({
    projectId,
    limit: 20,
    offset: 0,
  });

  return <ChangelogListView projectId={projectId} />;
}
