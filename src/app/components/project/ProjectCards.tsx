"use client";

import { ProjectList } from "~/app/components/shared/ProjectList";
import { type GetAllProjectsType } from "~/server/logic/project/GetAllProjectsUseCase";

export default function ProjectCards({
  projects,
  isLoading,
}: {
  projects: GetAllProjectsType;
  isLoading?: boolean;
}) {
  return (
    <ProjectList
      projects={projects}
      isLoading={isLoading}
      isCustomer={false}
      emptyMessage="Create a project to get started!"
    />
  );
}
