import {
  Card,
  Flex,
  Group,
  Paper,
  Progress,
  Stack,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
} from "@mantine/core";
import React from "react";
import { type GetSprintMemberMetricsUseCaseType } from "~/server/logic/sprint/GetSprintMemberMetricsUseCase";
import { type GetSprintMetricsUseCaseType } from "~/server/logic/sprint/GetSprintMetricsUseCase";

interface SprintMetricsProps {
  sprintMetrics: GetSprintMetricsUseCaseType;
  sprintMemberMetrics: GetSprintMemberMetricsUseCaseType;
}

const SprintMetricsDisplay: React.FC<SprintMetricsProps> = ({
  sprintMetrics,
  sprintMemberMetrics,
}) => {
  const MetricCard = ({
    title,
    value,
  }: {
    title: string;
    value: string | number;
  }) =>
    Number(value) > 0 && (
      <Card shadow="lg" withBorder padding="lg">
        <Text size="sm" fw={500}>
          {title}
        </Text>
        <Text size="xl" fw={700}>
          {value}
        </Text>
      </Card>
    );

  return (
    <Stack mt={"md"} gap="lg">
      <Flex
        justify="center"
        m={"md"}
        gap="sm"
        direction={{ base: "column", sm: "row" }}
      >
        <MetricCard
          title="Tasks Per Day (Actual)"
          value={sprintMetrics.tasksCompletePerDay}
        />
        <MetricCard
          title="Tasks Per Day (Planned)"
          value={sprintMetrics.tasksPlannedPerDay}
        />
      </Flex>

      {sprintMetrics.totalTasksPlanned > 0 && (
        <Paper shadow="lg" withBorder p={"md"}>
          <Group p="apart">
            <Text>
              Completed Tasks: {sprintMetrics.totalTasksComplete} /{" "}
              {sprintMetrics.totalTasksPlanned}
            </Text>
          </Group>
          <Progress.Root size="xl" mt="sm">
            <Progress.Section
              value={Number(
                ((sprintMetrics.totalTasksComplete ?? 0) /
                  sprintMetrics.totalTasksPlanned) *
                  100
              )}
            >
              <Progress.Label>
                {Number(
                  ((sprintMetrics.totalTasksComplete ?? 0) /
                    sprintMetrics.totalTasksPlanned) *
                    100
                ).toFixed(0)}
                %
              </Progress.Label>
            </Progress.Section>
          </Progress.Root>
        </Paper>
      )}

      {sprintMemberMetrics.length > 0 && (
        <Paper shadow="lg" withBorder p="md">
          <Table withColumnBorders highlightOnHover striped>
            <TableThead>
              <TableTr>
                <TableTh>Member</TableTh>
                <TableTh>Tasks Per Day (Actual)</TableTh>
                <TableTh>Tasks Per Day (Planned)</TableTh>
                <TableTh>Total Tasks Complete</TableTh>
                <TableTh>Total Tasks Planned</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {sprintMemberMetrics.map(
                (member, idx) =>
                  member && (
                    <TableTr key={idx}>
                      <TableTd>{member.name}</TableTd>
                      <TableTd>{member.tasksCompletePerDay}</TableTd>
                      <TableTd>{member.tasksPlannedPerDay}</TableTd>
                      <TableTd>{member.totalCompleteTasks}</TableTd>
                      <TableTd>{member.totalPlannedTasks}</TableTd>
                    </TableTr>
                  )
              )}
            </TableTbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
};

export default SprintMetricsDisplay;
