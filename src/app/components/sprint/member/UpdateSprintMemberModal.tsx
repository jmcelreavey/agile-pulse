"use client";

import {
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  Text,
  TextInput,
  type ModalProps,
} from "@mantine/core";
import { useForm, schemaResolver } from "@mantine/form";
import { useEffect } from "react";
import ErrorAlert from "~/app/components/base/alert/ErrorAlert";
import { DeleteSprintMemberButton } from "~/app/components/sprint/member/DeleteSprintMemberButton";
import { UpdateSprintMemberUseCase } from "~/app/logic/sprint/UpdateSprintMemberUseCase";
import {
  UpdateSprintMemberSchema,
  type UpdateSprintMemberInputType,
} from "~/server/api/schemas/sprint";
import { type GetSprintMembersUseCaseType } from "~/server/logic/sprint/GetSprintMembersUseCase";

export default function UpdateSprintMemberModal({
  sprintMember,
  opened,
  onClose,
  onMemberUpdate,
  ...props
}: ModalProps & {
  sprintMember: GetSprintMembersUseCaseType[0];
  onMemberUpdate?: (member: GetSprintMembersUseCaseType[0]) => void;
}) {
  const updateSprintMember = new UpdateSprintMemberUseCase();

  const form = useForm<UpdateSprintMemberInputType>({
    validateInputOnBlur: true,
    initialValues: {
      sprintMemberId: sprintMember.id,
      order: sprintMember.order,
      name: sprintMember.name,
    },
    validate: schemaResolver(UpdateSprintMemberSchema, { sync: true }),
  });

  useEffect(() => {
    form.setInitialValues({
      sprintMemberId: sprintMember.id,
      order: sprintMember.order,
      name: sprintMember.name,
    });
    form.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprintMember, form.setInitialValues, form.reset]);

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      {...props}
      onClose={handleClose}
      opened={opened || updateSprintMember.mutation.isPending}
      title={<Text fw={600}>Assign member</Text>}
      closeOnClickOutside={true}
    >
      <form
        onSubmit={form.onSubmit((values) => {
          void (async () => {
            await updateSprintMember.execute({
              sprintMember: values,
              reference: sprintMember.name,
            });

            if (onMemberUpdate) {
              onMemberUpdate({ ...sprintMember, ...values });
            }
            handleClose();

            updateSprintMember.setIsMutating(false);
          })();
        })}
      >
        <Stack gap="sm">
          <TextInput
            label="Member Name"
            placeholder="Enter member name"
            {...form.getInputProps("name")}
            withAsterisk
          />
          <NumberInput
            label="Order"
            placeholder="Enter order"
            min={0}
            step={1}
            {...form.getInputProps("order")}
            disabled={updateSprintMember.mutation.isPending}
            withAsterisk
          />
        </Stack>

        <ErrorAlert mutation={updateSprintMember.mutation} />

        <Group mt={16} justify="space-between">
          <DeleteSprintMemberButton
            onDelete={async () => handleClose()}
            size="sm"
            member={sprintMember}
            variant="filled"
            color="red.8"
          />
          <Group justify="right" gap="xs">
            <Button
              variant="default"
              onClick={handleClose}
              disabled={updateSprintMember.mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !form.isValid() ||
                updateSprintMember.mutation.isPending ||
                updateSprintMember.isMutating
              }
              loading={
                updateSprintMember.mutation.isPending ||
                updateSprintMember.isMutating
              }
            >
              Update
            </Button>
          </Group>
        </Group>
      </form>
    </Modal>
  );
}
