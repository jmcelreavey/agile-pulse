"use client";

import {
  Button,
  Container,
  Flex,
  SegmentedControl,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconBook, IconPlayerPlay, IconUserCircle } from "@tabler/icons-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { useUserTypeStore } from "~/app/components/layout/HeaderNewUserOptions";
import classes from "~/app/styles/Home.module.css";

// Component for user sign-in options on the homepage
export const HomeUnAuthorisedView = () => {
  const { userType, setUserType } = useUserTypeStore();

  const headings = {
    customer: "Project transparency at your fingertips",
    developer: "Less stress, more progress",
  };

  const slogans = {
    customer:
      "Stay updated on your project's progress and provide direction when needed",
    developer:
      "Your secret weapon against sprint meltdowns and last-minute panic!",
  };

  return (
    <Stack align="center" gap="xl">
      <SegmentedControl
        value={userType}
        onChange={(value) => setUserType(value)}
        data={[
          { value: "customer", label: "Customer" },
          { value: "developer", label: "Developer" },
        ]}
        size="md"
      />

      <Title
        ta={{ base: "left", sm: "center" }}
        fz={{ base: "2.25rem", sm: "3rem" }}
        mb="md"
        lts={-1}
        className={classes.title}
      >
        <Balancer>{headings[userType]}</Balancer>
      </Title>

      <Container pb={32} p={0} size="md">
        <Text
          fz={{ base: "md", sm: "lg", md: "xl" }}
          ta={{ base: "left", sm: "center" }}
        >
          <Balancer>{slogans[userType]}</Balancer>
        </Text>
      </Container>

      {userType === "customer" ? (
        <Flex gap="md" direction={{ base: "column", sm: "row" }} align="center">
          <Button
            component={Link}
            href="/customer/login"
            size="md"
            leftSection={<IconUserCircle size={18} />}
            color="teal"
          >
            Customer Portal
          </Button>
          <Text size="xs" c="dimmed">
            By invitation only
          </Text>
        </Flex>
      ) : (
        <Flex gap="md" direction={{ base: "column", sm: "row" }} align="center">
          <Button component={Link} href="/sign-in" size="md" variant="outline">
            Sign in
          </Button>

          <Button
            size="md"
            leftSection={<IconPlayerPlay size={18} />}
            onClick={() => void signIn("demo", { redirectTo: "/" })}
          >
            Explore the demo
          </Button>

          <Tooltip label="Access your project updates">
            <Button
              component={Link}
              href="/customer/login"
              size="sm"
              variant="subtle"
              leftSection={<IconUserCircle size={16} />}
              color="gray"
            >
              Customer Portal
            </Button>
          </Tooltip>
        </Flex>
      )}

      <Text size="sm" c="dimmed" ta="center" maw={560}>
        <Balancer>
          Forecasts, standups, retros and sprint planning worked out from your chart, with optional AI on top.{" "}
          <Link href="/docs">Read the docs</Link> to see how it all works.
        </Balancer>
      </Text>
      <Button component={Link} href="/docs/overview" variant="subtle" size="sm" leftSection={<IconBook size={16} />}>
        How it works and why
      </Button>
    </Stack>
  );
};
