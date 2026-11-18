import {
  Badge,
  Blockquote,
  Box,
  Divider,
  Flex,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import type { ReactNode } from "react";
import Balancer from "react-wrap-balancer";

interface EntityType {
  name: string;
  colour?: string | null;
  description?: string | null;
  createdAt?: Date | string | null;
  invitedAt?: Date | string | null; // Customer project specific
  startedAt?: Date | string | null; // Sprint specific
  completedAt?: Date | string | null; // Sprint specific
  state?: string; // Sometimes needed for displaying status
  reference?: string; // Sprint specific
}

interface EntityHeaderProps {
  entity: EntityType;
  type?: "project" | "sprint";
  rightElement?: ReactNode;
  additionalInfo?: ReactNode;
  withPaper?: boolean;
  subtitle?: string;
  showDate?: boolean;
  isCustomerView?: boolean;
}

export function EntityHeader({
  entity,
  type = "project",
  rightElement,
  additionalInfo,
  withPaper = true,
  subtitle,
  showDate = false,
  isCustomerView = false,
}: EntityHeaderProps) {
  const titleContent = (
    <Title
      ta={{ base: "left", sm: "center" }}
      fz={{ base: "1.75rem", sm: "2.5rem", md: "3rem" }}
      lts={-1}
      mb={additionalInfo ? "xs" : undefined}
    >
      <Blockquote color={entity.colour ?? undefined}>
        {entity.name}
        {subtitle && ` | ${subtitle}`}
      </Blockquote>
    </Title>
  );

  // Find the appropriate date to display
  const getDisplayDate = () => {
    if (isCustomerView && entity.invitedAt) {
      return { label: "Invited:", date: new Date(entity.invitedAt) };
    }

    if (type === "sprint") {
      if (entity.startedAt) {
        return { label: "Started:", date: new Date(entity.startedAt) };
      }
      if (entity.createdAt) {
        return { label: "Created:", date: new Date(entity.createdAt) };
      }
    } else {
      // Project
      if (entity.createdAt) {
        return { label: "Created:", date: new Date(entity.createdAt) };
      }
    }

    return null;
  };

  // Status badge - now always shown if state exists
  const statusBadge = entity.state && (
    <Badge size="md" variant="light" color="blue">
      {entity.state}
    </Badge>
  );

  // Create date display if showDate is true
  const dateInfo =
    showDate &&
    (() => {
      const displayDate = getDisplayDate();

      return (
        <Group wrap="wrap" gap="xs">
          {displayDate && (
            <Text size="sm" c="dimmed">
              <strong>{displayDate.label}</strong>{" "}
              {displayDate.date.toLocaleDateString()}
            </Text>
          )}
          {entity.colour && (
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                <strong>Project Colour:</strong>
              </Text>
              <Box
                style={{
                  width: 16,
                  height: 16,
                  backgroundColor: entity.colour,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                }}
              />
            </Group>
          )}
        </Group>
      );
    })();

  const content = (
    <Stack gap="md">
      <Flex
        align={{ base: "flex-start", sm: "center" }}
        justify="space-between"
        direction={{ base: rightElement ? "column" : "row", sm: "row" }}
        gap={{ base: "md", sm: "xs" }}
      >
        <Box w={{ base: "100%", sm: "auto" }}>
          {titleContent}
          {entity.description && (
            <Text c="dimmed" size="lg" mt="sm">
              <Balancer>{entity.description}</Balancer>
            </Text>
          )}
        </Box>
        {rightElement && (
          <Box
            w={{ base: "100%", sm: "auto" }}
            ta={{ base: "left", sm: "right" }}
          >
            {rightElement}
          </Box>
        )}
      </Flex>

      {(additionalInfo || dateInfo || statusBadge) && (
        <>
          <Divider />
          <Group justify="space-between" wrap="wrap">
            <Group wrap="wrap" gap="md">
              {dateInfo}
              {additionalInfo}
            </Group>
            {statusBadge}
          </Group>
        </>
      )}
    </Stack>
  );

  if (withPaper) {
    return (
      <Paper p={{ base: "md", sm: "xl" }} withBorder>
        {content}
      </Paper>
    );
  }

  return content;
}
