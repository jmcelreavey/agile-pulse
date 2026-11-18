"use client";

import { Button, Flex, Popover, Text, type ButtonProps } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { DeleteSprintMemberUseCase } from "~/app/logic/sprint/DeleteSprintMemberUseCase";
import { type GetSprintMembersUseCaseType } from "~/server/logic/sprint/GetSprintMembersUseCase";

export const DeleteSprintMemberButton = ({
  member,
  onDelete,
  ...props
}: {
  member: GetSprintMembersUseCaseType[0];
} & ButtonProps & {
    onDelete?: () => Promise<void>;
  }) => {
  const deleteMember = new DeleteSprintMemberUseCase();
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <Popover position="bottom" shadow="md" opened={opened} onChange={toggle}>
      <Popover.Target>
        <Button variant="light" onClick={toggle} size="md" {...props}>
          Delete Member
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Text>Are you sure you want to delete this member?</Text>
        <Flex justify="end" mt="sm" gap="sm">
          <Button variant="light" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={deleteMember.isMutating}
            loading={deleteMember.isMutating}
            color="red"
            onClick={async () => {
              await deleteMember.execute({
                id: member.id,
                reference: member.name,
              });

              await onDelete?.();
              close();
              deleteMember.setIsMutating(false);
            }}
          >
            Delete
          </Button>
        </Flex>
      </Popover.Dropdown>
    </Popover>
  );
};
