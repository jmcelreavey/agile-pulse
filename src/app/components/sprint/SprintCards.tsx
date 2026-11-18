"use client";

import { Box, Loader, SimpleGrid, Stack } from "@mantine/core";
import { SprintCard } from "~/app/components/sprint/SprintCard";
import { EmptyState } from "~/app/components/shared/EmptyState";
import { type GetOneProjectUseCaseType } from "~/server/logic/project/GetOneProjectUseCase";
import { type GetProjectSprintsUseCaseType } from "~/server/logic/project/GetProjectSprintsUseCase";

export default function SprintCards({
  sprints,
  project,
  isLoading,
}: {
  sprints: GetProjectSprintsUseCaseType;
  project: GetOneProjectUseCaseType;
  isLoading?: boolean;
}) {
  const noRecords = sprints.length === 0;

  return (
    <Stack mt={"lg"}>
      {noRecords && (
        <EmptyState
          title="No sprints found"
          description="Create a sprint to get started!"
        />
      )}
      {sprints && (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing="xl">
          {sprints
            .sort((a, b) => {
              // Sort by state priority first (In Progress > Not Started > Completed)
              const statePriority = (state: string) => {
                if (state === "In Progress") return 0;
                if (state === "Not Started") return 1;
                if (state === "Completed") return 2;
                return 3;
              };
              
              const stateComparison = statePriority(a.state) - statePriority(b.state);
              if (stateComparison !== 0) return stateComparison;
              
              // Then sort by start date (most recent first)
              if (a.startedAt && b.startedAt) {
                return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
              }
              
              // Finally by ID (newest first)
              return b.id - a.id;
            })
            .map((sprint, i) => {
              return <SprintCard sprint={sprint} project={project} key={i} />;
            })}
        </SimpleGrid>
      )}
      {!sprints && isLoading && (
        <Box ta={"center"}>
          <Loader />
        </Box>
      )}
    </Stack>
  );
}
