"use client";

import { ProjectList } from "~/app/components/shared/ProjectList";
import { type GetCustomerProjectsType } from "~/server/logic/customer/GetCustomerProjectsUseCase";

export default function CustomerProjectList({
  projects,
  isLoading,
}: {
  projects: GetCustomerProjectsType;
  isLoading?: boolean;
}) {
  return (
    <ProjectList
      projects={projects}
      isLoading={isLoading}
      isCustomer={true}
      emptyMessage="You haven't been invited to any projects yet. Contact your project manager to get access."
    />
  );
}
