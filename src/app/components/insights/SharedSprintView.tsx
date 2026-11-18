"use client";

import { Anchor, Badge, Box, Container, Group, Paper, SimpleGrid, Stack, Text, Title, Tooltip } from "@mantine/core";
import { IconCalendarPlus } from "@tabler/icons-react";
import Link from "next/link";
import { StatusBadge } from "~/app/components/insights/shared";
import { type ShareLinkUseCase } from "~/server/logic/insights/ShareUseCases";
import { columnCountForDays, createTimelineScale, percentForElapsedDays } from "~/shared/logic/sprint/chart/timelineScale";
import { getStateColour } from "~/shared/types/State";

type Shared = NonNullable<Awaited<ReturnType<ShareLinkUseCase["getShared"]>>>;

const Stat = ({ label, value }: { label: string; value: string }) => (
  <Paper withBorder p="md">
    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
      {label}
    </Text>
    <Text fw={700} size="xl">
      {value}
    </Text>
  </Paper>
);

/** A read-only sprint chart for people without an account. */
export const SharedSprintView = ({ data }: { data: Shared }) => {
  const { sprint, forecast, lanes, deadlines, eta } = data;
  // Same whole-day scale as the main chart, long enough to show today.
  const span = columnCountForDays(
    Math.max(sprint.days, forecast.currentDay, ...lanes.map((lane) => lane.tasks.reduce((sum, task) => sum + task.days, 0)))
  );
  const scale = createTimelineScale(Array.from({ length: span }, (_, i) => i + 1));
  const pct = (days: number) => `${(days / span) * 100}%`;
  const todayPercent = percentForElapsedDays(scale, forecast.currentDay);
  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text size="sm" c="dimmed">
              Shared read-only from Agile Pulse
            </Text>
            <Title order={1} fz={{ base: 26, sm: 34 }}>
              {sprint.projectName}: Sprint {sprint.reference}
            </Title>
          </div>
          <StatusBadge status={forecast.status} />
        </Group>
        <Text>{forecast.summary}</Text>
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          <Stat label="Day" value={`${forecast.currentDay} of ${forecast.sprintDays}`} />
          <Stat label="Forecast finish" value={`Day ${forecast.forecastEnd}`} />
          <Stat label="Pace" value={`${Math.round(forecast.pace * 100)}%`} />
          <Stat label="At risk" value={String(forecast.atRisk.length)} />
        </SimpleGrid>
        <Paper withBorder p="md">
          <Text fw={600} mb={4}>
            Expected delivery
          </Text>
          <Text>{eta.text}</Text>
        </Paper>

        <Paper withBorder p={{ base: "sm", sm: "lg" }}>
          <Stack gap="md">
            {lanes.map((lane) => (
              <div key={lane.member}>
                <Text size="sm" fw={600} mb={4}>
                  {lane.member}
                </Text>
                <Box pos="relative" h={40} style={{ display: "flex", borderRadius: 6, overflow: "hidden", background: "var(--mantine-color-default-border)" }}>
                  {lane.tasks.map((task) => (
                    <Tooltip key={task.key} label={`${task.name}: ${task.days}d, ${task.state}`}>
                      <Box
                        role="img"
                        aria-label={`${task.name}, ${task.days} days, ${task.state}`}
                        w={pct(task.days)}
                        h="100%"
                        bg={getStateColour(task.state)}
                        style={{ borderRight: "1px solid var(--mantine-color-body)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
                      >
                        <Text size="xs" c="white" fw={600} truncate px={4} style={{ textShadow: "0 0 4px black" }}>
                          {task.name}
                        </Text>
                      </Box>
                    </Tooltip>
                  ))}
                  {todayPercent !== null && (
                    <Box pos="absolute" top={0} bottom={0} left={`${todayPercent}%`} w={2} ml={-1} bg="red.6" aria-hidden data-chart-line="Current Day" />
                  )}
                </Box>
              </div>
            ))}
            <Text size="xs" c="dimmed">
              Bars are sized in days. The red line is today (day {forecast.currentDay}).
            </Text>
          </Stack>
        </Paper>

        {forecast.atRisk.length > 0 && (
          <Paper withBorder p="md">
            <Text fw={600} mb="xs">
              At risk
            </Text>
            <Stack gap={6}>
              {forecast.atRisk.map((task) => (
                <Text key={task.key} size="sm">
                  <b>{task.name}</b>: {task.reasons.map((reason) => reason.text).join(" ")}
                </Text>
              ))}
            </Stack>
          </Paper>
        )}

        {deadlines.length > 0 && (
          <Group gap="xs">
            {deadlines.map((deadline) => (
              <Badge key={`${deadline.day}-${deadline.name}`} variant="light" color={deadline.colour ?? "gray"}>
                Day {deadline.day}: {deadline.name}
              </Badge>
            ))}
          </Group>
        )}
        <Group justify="space-between">
          <Anchor href={data.calendarUrl.replace(/^https?:/, "webcal:")}>
            <Group gap={6}>
              <IconCalendarPlus size={16} aria-hidden />
              Add the deadlines to your calendar
            </Group>
          </Anchor>
          <Anchor component={Link} href="/docs" size="sm">
            What is Agile Pulse?
          </Anchor>
        </Group>
      </Stack>
    </Container>
  );
};
