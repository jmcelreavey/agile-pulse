// ErrorAlert.tsx
import { Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

interface Mutation {
  isError: boolean;
  error?: { message: string } | null;
}

interface ErrorAlertProps {
  mutation: Mutation;
}

const ErrorAlert = ({ mutation }: ErrorAlertProps) => {
  if (!mutation.isError) {
    return null;
  }

  return (
    <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
      {mutation.error?.message ?? "An error occurred"}
    </Alert>
  );
};

export default ErrorAlert;
