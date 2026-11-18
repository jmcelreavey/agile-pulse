"use client";

import {
  Alert,
  Anchor,
  Button,
  Container,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconInfoCircle } from "@tabler/icons-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CustomerLoginUseCase } from "~/app/logic/customer/CustomerLoginUseCase";

interface CustomerLoginForm {
  email: string;
  password: string;
}

export default function CustomerLoginView() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const customerLogin = new CustomerLoginUseCase();

  const form = useForm<CustomerLoginForm>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) => (value.length < 1 ? "Password is required" : null),
    },
  });

  const handleSubmit = async (values: CustomerLoginForm) => {
    setError(null);
    try {
      const callbackUrl =
        searchParams.get("callbackUrl") || "/customer/dashboard";
      await customerLogin.execute({
        credentials: values,
        callbackUrl,
      });
    } catch (err) {
      setError("Invalid email or password");
      console.error("Login error:", err);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" mb="md">
        Customer Login
      </Title>
      <Text c="dimmed" size="sm" ta="center" mb={32}>
        Sign in to access your project updates
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            {error && (
              <Alert
                icon={<IconInfoCircle size="1rem" />}
                color="red"
                variant="light"
              >
                {error}
              </Alert>
            )}

            <TextInput
              label="Email"
              placeholder="your@email.com"
              required
              {...form.getInputProps("email")}
              disabled={customerLogin.isMutating}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              {...form.getInputProps("password")}
              disabled={customerLogin.isMutating}
            />

            <Button
              type="submit"
              fullWidth
              loading={customerLogin.isMutating}
              disabled={!form.isValid()}
            >
              Sign in
            </Button>
          </Stack>
        </form>

        <Text c="dimmed" size="sm" ta="center" mt="md">
          Don&apos;t have an account yet?{" "}
          <Anchor component={Link} href="/customer/register" size="sm">
            Contact your project manager for an invitation
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}
