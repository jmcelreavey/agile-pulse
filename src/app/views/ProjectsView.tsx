"use client";

import { Badge, Box, Flex, Group, Stack, Text, Title } from "@mantine/core";
import { useSession } from "next-auth/react";
import Balancer from "react-wrap-balancer";
import { RestoreButton } from "~/app/components/delete/RestoreButton";
import CreateProjectModal from "~/app/components/project/CreateProjectModal";
import ProjectCards from "~/app/components/project/ProjectCards";
import { useProjectListQueries } from "~/app/hooks/useProjectListQueries";
import { InvalidateProjectListDataUseCase } from "~/app/logic/project/InvalidateProjectListDataUseCase";
import { DeleteSource } from "~/shared/types/DeleteSource";
import { State } from "~/shared/types/State";

export const ProjectsView = () => {

  const { deletedRecords, projects, isLoading } = useProjectListQueries();
  const hasDeletedRecords = deletedRecords.length > 0;
  const { data: session } = useSession();
  const userName = session?.user?.name;
  const userDomain = session?.user?.domain;

  const invalidateProjectListData = new InvalidateProjectListDataUseCase();

  // Calculate project counts
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.state !== State.COMPLETED).length;
  const completedProjects = projects.filter((p) => p.state === State.COMPLETED).length;

  return (
    <Box>
      <Stack>
        {/* Welcome Header */}
        <Box>
          <Group justify="space-between" align="flex-start" mb="md">
            <Box>
              <Title ta="left" mb="xs">
                Welcome, {userName}
              </Title>
              <Text c="dimmed" size="lg" mb="sm">
                <Balancer>
                  You are part of the <strong>{userDomain}</strong> organization.
                </Balancer>
              </Text>
              <Text c="dimmed" size="lg">
                <Balancer>
                  Here are the projects in your domain. Track progress, manage
                  sprints, and collaborate with your team.
                </Balancer>
              </Text>
            </Box>
            {totalProjects > 0 && (
              <Group gap="sm">
                <Badge variant="light" color="blue" size="lg">
                  {totalProjects} Total
                </Badge>
                {activeProjects > 0 && (
                  <Badge variant="light" color="green" size="lg">
                    {activeProjects} Active
                  </Badge>
                )}
                {completedProjects > 0 && (
                  <Badge variant="light" color="gray" size="lg">
                    {completedProjects} Completed
                  </Badge>
                )}
              </Group>
            )}
          </Group>
        </Box>

        {/* Restore button for deleted records */}
        {hasDeletedRecords && (
          <Box ta="right">
            <RestoreButton
              onRestore={() => {
                void invalidateProjectListData.execute();
              }}
              deletedRecords={deletedRecords}
              source={DeleteSource.PROJECT}
            />
          </Box>
        )}

        <Flex
          justify={{ base: "center", sm: "flex-start" }}
          mt="lg"
          gap="sm"
          direction={{ base: "column", sm: "row" }}
        >
          <CreateProjectModal size="md">Create project</CreateProjectModal>
        </Flex>
        <Stack mt={32} gap="xl" id="projects">
          <ProjectCards projects={projects} isLoading={isLoading} />
        </Stack>
      </Stack>
    </Box>
  );
};
