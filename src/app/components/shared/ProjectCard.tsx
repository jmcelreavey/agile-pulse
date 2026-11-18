"use client";

import {
    Badge,
    Box,
    Button,
    Card,
    CardSection,
    ColorSwatch,
    Divider,
    Flex,
    Group,
    Indicator,
    Text,
    Tooltip,
    rem,
} from "@mantine/core";
import { IconArrowRight, IconExternalLink } from "@tabler/icons-react";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { CustomerCommentNotifications } from "~/app/components/customer/CustomerCommentNotifications";
import { ProjectCompleteIndicator } from "~/app/components/shared/ProjectCompleteIndicator";
import { type State } from "~/shared/types/State";

interface BaseProjectProps {
  id: number;
  name: string;
  description: string;
  state: State | string;
  colour?: string | null;
  completedAt?: Date | null;
  startedAt?: Date | null;
}

interface DeveloperProjectProps extends BaseProjectProps {
  isCustomer?: false;
  lastUpdatedSprint?: {
    id: number;
    reference: string;
  } | null;
  sprintsCount?: number;
  ticketUrlTemplate?: string | null;
  ticketUrlPrefix?: string | null;
  jiraProjectKey?: string | null;
  jiraProjectId?: string | null;
  jiraDomain?: string | null;
  jiraConnected?: boolean;
}

interface CustomerProjectProps extends BaseProjectProps {
  isCustomer: true;
  invitedAt: Date;
  lastUpdatedSprint?: {
    id: number;
    reference: string;
  } | null;
  sprintsCount?: number;
}

type ProjectCardProps = DeveloperProjectProps | CustomerProjectProps;

export function ProjectCard(props: ProjectCardProps) {
  const { id, name, description, state, colour } = props;

  // Check if this is a customer view
  const isCustomer = "isCustomer" in props && props.isCustomer === true;

  // Determine the route for the project
  const projectRoute = isCustomer
    ? `/customer/project/${id}`
    : `/projects/${id}`;

  // Format the project state as a badge with appropriate color
  // Format the project state as a badge with appropriate color
  const getStateBadgeColor = (state: State | string) => {
    const stateValue = state.toString();
    switch (stateValue) {
      case "Completed":
        return "green";
      case "In Progress":
        return "blue";
      case "Not Started":
        return "yellow";
      default:
        return "gray";
    }
  };

  // Get sprint information
  const lastUpdatedSprint =
    "lastUpdatedSprint" in props ? props.lastUpdatedSprint : null;
  const sprintsCount = "sprintsCount" in props ? props.sprintsCount : 0;

  const isCompleted = state.toString() === "Completed";

  return (
    <Indicator
      disabled={!isCompleted}
      color={"transparent"}
      label={
        <ProjectCompleteIndicator
          startedAt={props.startedAt}
          completedAt={props.completedAt}
        />
      }
      inline
      position="top-center"
      size={32}
    >
      <Card withBorder shadow="md">
        <Link
          style={{ textDecoration: "none", color: "inherit" }}
          href={projectRoute}
        >
          <CardSection c={"inherit"}>
            <Box style={{ position: "relative" }}>
              <Box pt={rem(16)} pl={rem(16)} pb={rem(12)} pr={rem(32)}>
                <Flex direction="column" gap="xs">
                  <Text size="lg" fw={600}>
                    <Balancer>{name}</Balancer>
                  </Text>

                  {/* Status Badge */}
                  <Group gap="xs">
                    <Badge
                      size="sm"
                      variant="light"
                      color={getStateBadgeColor(state)}
                    >
                      {state}
                    </Badge>

                    {/* Developer specific badges */}
                    {!isCustomer &&
                      "ticketUrlPrefix" in props &&
                      props.ticketUrlPrefix && (
                        <Tooltip label="Custom ticket links configured">
                          <Badge
                            size="sm"
                            variant="filled"
                            color="blue"
                            leftSection={<IconExternalLink size={12} />}
                          >
                            {props.ticketUrlPrefix.replace(/[-_]+$/, "")}
                          </Badge>
                        </Tooltip>
                      )}

                    {/* Sprint count badge */}
                    {sprintsCount !== undefined && sprintsCount > 0 && (
                      <Badge variant="light" color="gray" size="sm">
                        {sprintsCount} Sprint{sprintsCount !== 1 ? "s" : ""}
                      </Badge>
                    )}

                    {/* Customer Comments Notification - Only for Developer view */}
                    {!isCustomer && (
                      <CustomerCommentNotifications
                        projectId={id}
                        variant="badge"
                        showCount={true}
                      />
                    )}
                  </Group>
                </Flex>
              </Box>
              {colour && (
                <Box style={{ position: "absolute", top: 0, right: 0 }}>
                  <ColorSwatch radius={"0 0 0 5"} color={colour} />
                </Box>
              )}
            </Box>
          </CardSection>
          <Divider />
          <Flex mt={rem(8)} mb={rem(8)} px={rem(16)}>
            <Text c="dimmed" size="sm" lh={1.4}>
              <Balancer>{description}</Balancer>
            </Text>
          </Flex>
        </Link>

        {/* Card Footer - Sprint link */}
        <Group justify={"space-between"} mt={rem(12)} px={rem(16)} pb={rem(12)}>
          {lastUpdatedSprint && (
            <Link
              href={`${projectRoute}/sprints/${lastUpdatedSprint.id}`}
              style={{ textDecoration: "none" }}
            >
              <Button
                size="compact-sm"
                rightSection={<IconArrowRight width={14} height={14} />}
                variant="light"
              >
                Sprint {lastUpdatedSprint.reference}
              </Button>
            </Link>
          )}

          {/* Customer Invited Date */}
          {isCustomer && (
            <Text size="xs" c="dimmed">
              Invited: {new Date(props.invitedAt).toLocaleDateString()}
            </Text>
          )}
        </Group>
      </Card>
    </Indicator>
  );
}
