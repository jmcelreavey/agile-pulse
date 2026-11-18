"use client";

/**
 * The signed-in screens render in the browser only. Loading them with `ssr: false` keeps their
 * code (charts, drag and drop, the rich text editor) out of the server bundle, which keeps the
 * Worker inside Cloudflare's free plan size limit.
 */
import dynamic from "next/dynamic";
import { Center, Loader } from "@mantine/core";

const loading = () => (
  <Center py="xl">
    <Loader aria-label="Loading" />
  </Center>
);

export const ProjectsView = dynamic(
  () => import("~/app/views/ProjectsView").then((m) => m.ProjectsView),
  { ssr: false, loading }
);
export const ProjectView = dynamic(
  () => import("~/app/views/ProjectView").then((m) => m.ProjectView),
  { ssr: false, loading }
);
export const SprintView = dynamic(
  () => import("~/app/views/SprintView").then((m) => m.SprintView),
  { ssr: false, loading }
);
export const SprintSnapshotView = dynamic(
  () => import("~/app/views/SprintSnapshotView").then((m) => m.SprintSnapshotView),
  { ssr: false, loading }
);
export const ChangelogListView = dynamic(
  () => import("~/app/views/ChangelogListView").then((m) => m.ChangelogListView),
  { ssr: false, loading }
);
export const CustomerSprintView = dynamic(
  () => import("~/app/views/CustomerSprintView").then((m) => m.CustomerSprintView),
  { ssr: false, loading }
);
export const CustomerProjectDetailView = dynamic(() => import("~/app/views/CustomerProjectDetailView"), {
  ssr: false,
  loading,
});
export const CustomerDashboardView = dynamic(() => import("~/app/views/CustomerDashboardView"), {
  ssr: false,
  loading,
});
