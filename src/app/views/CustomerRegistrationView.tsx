"use client";

import {
  Alert,
  Button,
  Center,
  Container,
  Loader,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconInfoCircle } from "@tabler/icons-react";
import { useState } from "react";
import { useCustomerValidationQueries } from "~/app/hooks/useCustomerQueries";
import { useCustomerRegistrationForm } from "~/app/hooks/useCustomerForms";
import { CustomerRegistrationUseCase } from "~/app/logic/customer/CustomerRegistrationUseCase";

export default function CustomerRegistrationView({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const customerRegistration = new CustomerRegistrationUseCase();

  // Use hook for validation query
  const { invitation, isLoading: isValidating } = useCustomerValidationQueries({
    token,
  });

  // Form handling
  const form = useCustomerRegistrationForm();

  const handleSubmit = async (values: typeof form.values) => {
    setError(null);
    try {
      await customerRegistration.execute({
        token,
        registrationData: values,
      });
    } catch (err) {
      setError("Failed to create account. Please try again.");
      console.error("Registration error:", err);
    }
  };

  if (isValidating) {
    return (
      <Container size={420} my={40}>
        <Center>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text>Validating invitation...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (!invitation) {
    return (
      <Container size={420} my={40}>
        <Paper withBorder shadow="md" p={30} radius="md">
          <Alert
            icon={<IconAlertCircle size="1rem" />}
            color="red"
            variant="light"
          >
            <Title order={4} mb="sm">
              Invalid or Expired Invitation
            </Title>
            <Text size="sm">
              This invitation link is invalid or has expired. Please contact
              your project manager for a new invitation.
            </Text>
          </Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size={420} my={40}>
      <Title ta="center" mb="md">
        Create Your Account
      </Title>
      <Text c="dimmed" size="sm" ta="center" mb={32}>
        You&apos;ve been invited to access project:{" "}
        <strong>{invitation.project.name}</strong>
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
              value={invitation.email}
              disabled
              description="This is the email address the invitation was sent to"
            />

            <TextInput
              label="Full Name"
              placeholder="Your full name"
              required
              {...form.getInputProps("name")}
              disabled={customerRegistration.isMutating}
            />

            <TextInput
              label="Company Name"
              placeholder="Your company name (optional)"
              {...form.getInputProps("companyName")}
              disabled={customerRegistration.isMutating}
            />

            <PasswordInput
              label="Password"
              placeholder="Create a secure password"
              required
              {...form.getInputProps("password")}
              disabled={customerRegistration.isMutating}
              description="Password must be at least 8 characters long"
            />

            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm your password"
              required
              {...form.getInputProps("confirmPassword")}
              disabled={customerRegistration.isMutating}
            />

            <Button
              type="submit"
              fullWidth
              loading={customerRegistration.isMutating}
              disabled={!form.isValid()}
            >
              Create Account
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
