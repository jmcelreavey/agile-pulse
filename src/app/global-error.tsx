"use client";

import {
  Button,
  Center,
  Container,
  Group,
  Image,
  Text,
  Title,
} from "@mantine/core";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import classes from "~/app/styles/NotFound.module.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className={classes.root} size="md">
      <Center mb="xl" style={{ flexDirection: "column" }}>
        <Image src="/images/logo.svg" alt="Logo" width={60} height={60} />
        <Title>Agile-Pulse</Title>
      </Center>
      <div className={classes.label}>{error.name}</div>
      <Title className={classes.title}>
        <Balancer>{error.message}</Balancer>
      </Title>
      <Text c="dimmed" size="lg" ta="center" className={classes.description}>
        <Balancer>
          Something went wrong, we are working on it and will fix it as soon as
          possible.
        </Balancer>
      </Text>
      <Group justify="center">
        <Button variant="subtle" size="md" component={Link} href="/">
          Take me back to home page
        </Button>
        <Button variant="subtle" size="md" onClick={reset}>
          Reset
        </Button>
      </Group>
    </Container>
  );
}
