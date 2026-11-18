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
import { useEffect, useState } from "react";
import { useCustomerValidationQueries } from "~/app/hooks/useCustomerQueries";
import { useCustomerAcceptInvitationForm } from "~/app/hooks/useCustomerForms";
import { CustomerAcceptInvitationUseCase } from "~/app/logic/customer/CustomerAcceptInvitationUseCase";

export default function CustomerAcceptInvitationView({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const customerAcceptInvitation = new CustomerAcceptInvitationUseCase();

  // Use hook for validation query
  const { invitation, isLoading: isValidating } = useCustomerValidationQueries({
    token,
  });

  // Use custom form hook
  const form = useCustomerAcceptInvitationForm(invitation?.email);

  // Update form email when invitation loads
  useEffect(() => {
    if (invitation && form.values.email !== invitation.email) {
      form.setFieldValue("email", invitation.email);
    }
  }, [invitation, form]);

  const handleSubmit = async (values: typeof form.values) => {
    setError(null);
    try {
      await customerAcceptInvitation.execute({
        token,
        acceptInvitationData: values,
      });
    } catch (err) {
      setError("Failed to accept invitation. Please check your credentials and try again.");
      console.error("Accept invitation error:", err);
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
        Accept Project Invitation
      </Title>
      <Text c="dimmed" size="sm" ta="center" mb={32}>
        You&apos;ve been invited to access project:{" "}
        <strong>{invitation.project.name}</strong>
        <br />
        Please sign in with your existing account to accept this invitation.
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
              placeholder="Your email address"
              required
              {...form.getInputProps("email")}
              disabled={customerAcceptInvitation.isMutating}
              description="This should match your existing account email"
            />

            <PasswordInput
              label="Password"
              placeholder="Your account password"
              required
              {...form.getInputProps("password")}
              disabled={customerAcceptInvitation.isMutating}
              description="Enter your existing account password"
            />

            <Button
              type="submit"
              fullWidth
              loading={customerAcceptInvitation.isMutating}
              disabled={!form.isValid()}
            >
              Accept Invitation
            </Button>

            <Text size="sm" c="dimmed" ta="center">
              Don&apos;t have an account yet?{" "}
              <Text component="span" c="blue" style={{ cursor: "pointer" }}>
                Contact your project manager for a registration link.
              </Text>
            </Text>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}