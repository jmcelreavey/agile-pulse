"use client";

import type { ReactNode } from "react";
import { Button, Paper, Stack, Text } from "@mantine/core";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    leftSection?: ReactNode;
    disabled?: boolean;
  };
  withBorder?: boolean;
  padding?: string;
}

export function EmptyState({
  title,
  description,
  action,
  withBorder = true,
  padding = "xl"
}: EmptyStateProps) {
  return (
    <Paper p={padding} withBorder={withBorder} ta="center">
      <Stack gap="md" align="center">
        <Text c="dimmed" size="lg">
          {title}
        </Text>
        {description && (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        )}
        {action && (
          <Button
            onClick={action.onClick}
            leftSection={action.leftSection}
            disabled={action.disabled}
            mt="sm"
          >
            {action.label}
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
