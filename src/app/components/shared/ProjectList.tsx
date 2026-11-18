"use client";

import { Box, Loader, SimpleGrid, Stack } from "@mantine/core";
import { EmptyState } from "~/app/components/shared/EmptyState";
import { ProjectCard } from "~/app/components/shared/ProjectCard";
import { type GetCustomerProjectsType } from "~/server/logic/customer/GetCustomerProjectsUseCase";
import { type GetAllProjectsType } from "~/server/logic/project/GetAllProjectsUseCase";

type ProjectListProps =
  | {
      projects: GetAllProjectsType;
      isLoading?: boolean;
      isCustomer?: false;
      emptyMessage?: string;
    }
  | {
      projects: GetCustomerProjectsType;
      isLoading?: boolean;
      isCustomer: true;
      emptyMessage?: string;
    };

export function ProjectList(props: ProjectListProps) {
  const { projects, isLoading, emptyMessage } = props;

  const renderDeveloperProjects = (projects: GetAllProjectsType) => (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing="xl">
      {projects.map((project, i) => (
        <ProjectCard key={i} {...project} />
      ))}
    </SimpleGrid>
  );

  const renderCustomerProjects = (projects: GetCustomerProjectsType) => (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing="xl">
      {projects.map((project, i) => (
        <ProjectCard key={i} {...project} isCustomer={true} />
      ))}
    </SimpleGrid>
  );

  return (
    <Stack gap="xl">
      {projects && projects.length === 0 && (
        <EmptyState
          title="No projects found"
          description={emptyMessage ?? "Create your first project to get started!"}
        />
      )}
      {projects && projects.length > 0 && (
        props.isCustomer 
          ? renderCustomerProjects(projects as GetCustomerProjectsType)
          : renderDeveloperProjects(projects as GetAllProjectsType)
      )}
      {!projects && isLoading && (
        <Box ta={"center"}>
          <Loader />
        </Box>
      )}
    </Stack>
  );
}
