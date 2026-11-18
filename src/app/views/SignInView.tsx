"use client";

import { Box, Button, Paper, Stack, Text, Title } from "@mantine/core";
import { IconPlayerPlay } from "@tabler/icons-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { SiGoogle, SiJira } from "react-icons/si";

export type SignInProviders = { google: boolean; jira: boolean; demo: boolean };

type Provider = "google" | "atlassian" | "demo";

export default function SignInView({ providers }: { providers: SignInProviders }) {
  const [pending, setPending] = useState<Provider | null>(null);

  const start = async (provider: Provider) => {
    setPending(provider);
    await signIn(provider, { redirectTo: "/" });
  };

  return (
    <Box maw={420} mx="auto">
      <Title ta="center" order={2}>
        Sign in to Agile Pulse
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5} mb={30}>
        Plan sprints, track delivery and keep customers in the loop.
      </Text>
      <Paper radius="md" p="xl" withBorder shadow="md">
        <Stack gap="xs">
          {providers.demo && (
            <Button
              radius="xl"
              onClick={() => void start("demo")}
              loading={pending === "demo"}
              disabled={pending !== null && pending !== "demo"}
              leftSection={<IconPlayerPlay size="0.9rem" />}
            >
              Explore the demo
            </Button>
          )}
          {providers.google && (
            <Button
              radius="xl"
              onClick={() => void start("google")}
              loading={pending === "google"}
              disabled={pending !== null && pending !== "google"}
              leftSection={<SiGoogle size="0.9rem" />}
              variant="default"
            >
              Google
            </Button>
          )}
          {providers.jira && (
            <Button
              radius="xl"
              onClick={() => void start("atlassian")}
              loading={pending === "atlassian"}
              disabled={pending !== null && pending !== "atlassian"}
              leftSection={<SiJira size="0.9rem" />}
              variant="default"
            >
              Jira
            </Button>
          )}
          {providers.demo && (
            <Text size="xs" c="dimmed" ta="center" mt="xs">
              The demo account is shared and its data resets every day.
            </Text>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
