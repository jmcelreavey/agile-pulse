"use client";

import { Badge, Button, CopyButton, Group, Text, Tooltip } from "@mantine/core";
import { IconCheck, IconCopy, IconSparkles } from "@tabler/icons-react";
import { type ForecastStatus } from "~/shared/logic/insights/forecast";

export const STATUS_LABEL: Record<ForecastStatus, { label: string; color: string }> = {
  "not-started": { label: "Not started", color: "gray" },
  "on-track": { label: "On track", color: "green" },
  "at-risk": { label: "At risk", color: "orange" },
  late: { label: "Late", color: "red" },
  done: { label: "Done", color: "teal" },
};

export const StatusBadge = ({ status, size = "lg" }: { status: ForecastStatus; size?: "sm" | "md" | "lg" }) => (
  <Badge size={size} color={STATUS_LABEL[status].color} variant="light">
    {STATUS_LABEL[status].label}
  </Badge>
);

/** Shows where a piece of text came from: the built-in rules or OpenAI. */
export const SourceBadge = ({ source }: { source: "built-in" | "openai" }) => (
  <Tooltip label={source === "openai" ? "Written by OpenAI from the same data" : "Written by Agile Pulse's built-in rules; no AI involved"}>
    <Badge size="sm" variant="outline" color={source === "openai" ? "violet" : "gray"} leftSection={source === "openai" ? <IconSparkles size={12} /> : undefined}>
      {source === "openai" ? "AI" : "Built-in"}
    </Badge>
  </Tooltip>
);

export const CopyTextButton = ({ value, label = "Copy" }: { value: string; label?: string }) => (
  <CopyButton value={value} timeout={2000}>
    {({ copied, copy }) => (
      <Button size="xs" variant="light" onClick={copy} leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}>
        {copied ? "Copied" : label}
      </Button>
    )}
  </CopyButton>
);

export const Hint = ({ children }: { children: React.ReactNode }) => (
  <Text size="sm" c="dimmed" component="div">
    {children}
  </Text>
);

export const Row = ({ children }: { children: React.ReactNode }) => (
  <Group justify="space-between" align="center" wrap="wrap" gap="sm">
    {children}
  </Group>
);
