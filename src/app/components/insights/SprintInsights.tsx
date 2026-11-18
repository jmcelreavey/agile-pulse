"use client";

import { Paper, Tabs, Text, Title } from "@mantine/core";
import { IconCalendarStats, IconGitPullRequest, IconListCheck, IconMessage2, IconMoodSearch, IconShare, IconWand } from "@tabler/icons-react";
import { CustomerUpdatePanel } from "~/app/components/insights/CustomerUpdatePanel";
import { ForecastPanel } from "~/app/components/insights/ForecastPanel";
import { LinksPanel } from "~/app/components/insights/LinksPanel";
import { PlannerPanel } from "~/app/components/insights/PlannerPanel";
import { RetroPanel } from "~/app/components/insights/RetroPanel";
import { SharePanel } from "~/app/components/insights/SharePanel";
import { StandupPanel } from "~/app/components/insights/StandupPanel";

/** Forecast, standup, retro, planner, linked work, customer update and sharing for one sprint. */
export const SprintInsights = ({ sprintId, isCompleted }: { sprintId: number; isCompleted: boolean }) => (
  <Paper withBorder p={{ base: "md", sm: "xl" }} mt="xl" id="insights">
    <Title order={3} mb={4}>
      Sprint insights
    </Title>
    <Text size="sm" c="dimmed" mb="md">
      Worked out from the chart and its daily snapshots. Nothing here needs an AI key; with one set, a few answers get written up by
      OpenAI.
    </Text>
    <Tabs defaultValue="forecast" keepMounted={false}>
      <Tabs.List mb="lg" style={{ overflowX: "auto", flexWrap: "nowrap" }}>
        <Tabs.Tab value="forecast" leftSection={<IconCalendarStats size={16} />}>
          Forecast
        </Tabs.Tab>
        <Tabs.Tab value="standup" leftSection={<IconListCheck size={16} />}>
          Standup
        </Tabs.Tab>
        <Tabs.Tab value="retro" leftSection={<IconMoodSearch size={16} />}>
          Retro
        </Tabs.Tab>
        <Tabs.Tab value="planner" leftSection={<IconWand size={16} />}>
          Planner
        </Tabs.Tab>
        <Tabs.Tab value="links" leftSection={<IconGitPullRequest size={16} />}>
          Linked work
        </Tabs.Tab>
        <Tabs.Tab value="update" leftSection={<IconMessage2 size={16} />}>
          Customer update
        </Tabs.Tab>
        <Tabs.Tab value="share" leftSection={<IconShare size={16} />}>
          Share
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="forecast">
        <ForecastPanel sprintId={sprintId} />
      </Tabs.Panel>
      <Tabs.Panel value="standup">
        <StandupPanel sprintId={sprintId} />
      </Tabs.Panel>
      <Tabs.Panel value="retro">
        <RetroPanel sprintId={sprintId} />
      </Tabs.Panel>
      <Tabs.Panel value="planner">
        <PlannerPanel sprintId={sprintId} disabled={isCompleted} />
      </Tabs.Panel>
      <Tabs.Panel value="links">
        <LinksPanel sprintId={sprintId} disabled={isCompleted} />
      </Tabs.Panel>
      <Tabs.Panel value="update">
        <CustomerUpdatePanel sprintId={sprintId} disabled={isCompleted} />
      </Tabs.Panel>
      <Tabs.Panel value="share">
        <SharePanel sprintId={sprintId} />
      </Tabs.Panel>
    </Tabs>
  </Paper>
);
