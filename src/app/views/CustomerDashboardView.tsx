"use client";

import { Badge, Box, Group, Stack, Text, Title } from "@mantine/core";
import { useSession } from "next-auth/react";
import Balancer from "react-wrap-balancer";
import CustomerProjectList from "~/app/components/customer/CustomerProjectList";
import CustomerPendingInvitations from "~/app/components/customer/CustomerPendingInvitations";
import { useCustomerProjectQueries, useCustomerPendingInvitationsQueries } from "~/app/hooks/useCustomerQueries";

export default function CustomerDashboardView() {
  const { projects, isLoading } = useCustomerProjectQueries();
  const { invitations = [], isLoading: isLoadingInvitations } = useCustomerPendingInvitationsQueries();
  const { data: session } = useSession();

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.state !== "Completed").length;
  const completedProjects = projects.filter(
    (p) => p.state === "Completed"
  ).length;

  return (
    <Stack gap="xl">
      {/* Welcome Header */}
      <Box>
        <Group justify="space-between" align="flex-start" mb="md">
          <Box>
            <Title ta="left" mb="xs">
              Welcome back, {session?.user?.name}
            </Title>
            <Text c="dimmed" size="lg">
              <Balancer>
                Here are the projects you&apos;ve been invited to collaborate
                on.
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

      {/* Pending Invitations Section */}
      <CustomerPendingInvitations
        invitations={invitations}
        isLoading={isLoadingInvitations}
      />

      <CustomerProjectList projects={projects} isLoading={isLoading} />
    </Stack>
  );
}
