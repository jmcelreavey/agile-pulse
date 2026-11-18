import type { Metadata } from "next";
import { ChangelogListView } from "~/app/views/lazy";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Changelog Management - Agile Pulse",
  description: "Manage and track all sprint changelogs",
};

export default async function ChangelogsPage() {
  // Prefetch initial changelogs data
  void api.changelog.getAll.prefetch({
    limit: 20,
    offset: 0,
  });

  return <ChangelogListView />;
}
