"use client";

import { Button, Modal, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { CreateInvitationUseCase } from "~/app/logic/customer/CreateInvitationUseCase";

interface InviteCustomerModalProps {
  opened: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
}

interface InviteCustomerForm {
  email: string;
}

export default function InviteCustomerModal({
  opened,
  onClose,
  projectId,
  projectName,
}: InviteCustomerModalProps) {
  const createInvitation = new CreateInvitationUseCase();

  const form = useForm<InviteCustomerForm>({
    initialValues: {
      email: "",
    },
    validate: {
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value)
          ? null
          : "Please enter a valid email address",
    },
  });

  const handleSubmit = async (values: InviteCustomerForm) => {
    try {
      await createInvitation.execute({
        email: values.email,
        projectId,
      });

      form.reset();
      onClose();
    } catch (error) {
      // Error handling is done in the use case
      console.error("Error inviting customer:", error);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Invite Customer to ${projectName}`}
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Send an invitation email to a customer to give them access to this
            project. They will be able to view project updates and leave
            comments.
          </Text>

          <TextInput
            label="Customer Email"
            placeholder="customer@company.com"
            required
            {...form.getInputProps("email")}
            disabled={createInvitation.isMutating}
            data-autofocus
          />

          <Stack gap="xs" mt="md">
            <Button
              type="submit"
              loading={createInvitation.isMutating}
              disabled={!form.isValid()}
            >
              Send Invitation
            </Button>

            <Button
              variant="light"
              onClick={onClose}
              disabled={createInvitation.isMutating}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </form>
    </Modal>
  );
}
