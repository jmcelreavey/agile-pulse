"use client";

import { Alert, Badge, Button, Group, List, Paper, Progress, SimpleGrid, Skeleton, Stack, Table, Text, ThemeIcon } from "@mantine/core";
import { IconAlertTriangle, IconBulb, IconCalendarDue } from "@tabler/icons-react";
import { Hint, Row, SourceBadge, StatusBadge } from "~/app/components/insights/shared";
import { api } from "~/trpc/react";

const Stat = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <Paper withBorder p="md">
    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
      {label}
    </Text>
    <Text fz={26} fw={700}>
      {value}
    </Text>
    {hint && <Text size="xs" c="dimmed">{hint}</Text>}
  </Paper>
);

export const ForecastPanel = ({ sprintId }: { sprintId: number }) => {
  const query = api.insights.forecast.useQuery({ sprintId });
  const explain = api.insights.explainForecast.useMutation();
  if (query.isLoading || !query.data) return <Skeleton h={240} />;
  const { forecast, eta } = query.data;

  return (
    <Stack gap="lg">
      <Row>
        <Group gap="sm">
          <StatusBadge status={forecast.status} />
          <Text fw={600}>{forecast.summary}</Text>
        </Group>
      </Row>

      <SimpleGrid cols={{ base: 2, md: 4 }}>
        <Stat label="Forecast landing" value={`Day ${forecast.forecastEnd}`} hint={`of ${forecast.sprintDays}; the plan says day ${forecast.plannedEnd}`} />
        <Stat label="Pace" value={forecast.currentDay ? `${Math.round(forecast.pace * 100)}%` : "–"} hint="of the planned pace so far" />
        <Stat label="At risk" value={String(forecast.atRisk.length)} hint={`${forecast.atRisk.filter((t) => t.severity === "high").length} high`} />
        <Stat label="Scope added" value={`${forecast.scopeAddedDays}d`} hint="since the sprint started" />
      </SimpleGrid>

      <Alert variant="light" color="blue" icon={<IconCalendarDue size={18} />} title="Customer-facing ETA">
        {eta.text}
      </Alert>

      <Group gap="sm">
        <Button size="xs" variant="light" leftSection={<IconBulb size={14} />} loading={explain.isPending} onClick={() => explain.mutate({ sprintId })}>
          Why?
        </Button>
        {explain.data && (
          <Group gap="xs" wrap="nowrap">
            <SourceBadge source={explain.data.source} />
            <Text size="sm">{explain.data.why}</Text>
          </Group>
        )}
      </Group>

      <div>
        <Text fw={600} mb="xs">
          Lanes
        </Text>
        <Table.ScrollContainer minWidth={520}>
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Member</Table.Th>
                <Table.Th>Plan ends</Table.Th>
                <Table.Th>Forecast</Table.Th>
                <Table.Th>Pace</Table.Th>
                <Table.Th w="30%">Against the sprint</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {forecast.lanes.map((lane) => {
                const late = lane.forecastEnd > forecast.sprintDays;
                return (
                  <Table.Tr key={lane.member}>
                    <Table.Td>{lane.member}</Table.Td>
                    <Table.Td>Day {lane.plannedEnd}</Table.Td>
                    <Table.Td>
                      <Text c={late ? "red" : undefined} fw={late ? 600 : undefined} size="sm">
                        Day {lane.forecastEnd}
                      </Text>
                    </Table.Td>
                    <Table.Td>{forecast.currentDay ? `${Math.round(lane.pace * 100)}%` : "–"}</Table.Td>
                    <Table.Td>
                      <Progress
                        aria-label={`${lane.member} forecast against sprint length`}
                        value={Math.min(100, (lane.forecastEnd / Math.max(forecast.sprintDays, lane.forecastEnd)) * 100)}
                        color={late ? "red" : "teal"}
                      />
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </div>

      <div>
        <Text fw={600} mb="xs">
          Tasks at risk
        </Text>
        {forecast.atRisk.length === 0 ? (
          <Hint>Nothing looks at risk.</Hint>
        ) : (
          <Stack gap="xs">
            {forecast.atRisk.map((task) => (
              <Paper key={task.key} withBorder p="sm">
                <Group gap="sm" wrap="nowrap" align="flex-start">
                  <ThemeIcon variant="light" color={task.severity === "high" ? "red" : "orange"} aria-hidden>
                    <IconAlertTriangle size={16} />
                  </ThemeIcon>
                  <div style={{ flex: 1 }}>
                    <Group gap="xs">
                      <Text fw={600}>{task.name}</Text>
                      <Badge size="xs" variant="light" color={task.severity === "high" ? "red" : "orange"}>
                        {task.severity}
                      </Badge>
                      <Text size="sm" c="dimmed">
                        {task.member ?? "Unassigned"} · {task.state}
                      </Text>
                    </Group>
                    <List size="sm" mt={4}>
                      {task.reasons.map((reason) => (
                        <List.Item key={reason.code}>{reason.text}</List.Item>
                      ))}
                    </List>
                  </div>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </div>
      <Hint>
        Built from the chart and its daily snapshots: each lane&apos;s pace is the work done so far over the work the plan expected by
        today. See the docs for the exact rules.
      </Hint>
    </Stack>
  );
};
