"use client";

import { Button, Flex, Popover, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconTrash } from "@tabler/icons-react";
import { DeleteSprintUseCase } from "~/app/logic/sprint/DeleteSprintUseCase";
import { type GetOneSprintUseCaseType } from "~/server/logic/sprint/GetOneSprintUseCase";

export const DeleteSprintButton = ({
  sprint,
  variant = "default",
}: {
  sprint: GetOneSprintUseCaseType;
  variant?: "default" | "icon-only";
}) => {
  const [opened, { toggle, close }] = useDisclosure();
  const deleteSprint = new DeleteSprintUseCase();

  return (
    <Popover position="bottom" shadow="md" opened={opened} onChange={toggle}>
      <Popover.Target>
        {variant === "icon-only" ? (
          <Tooltip label="Delete Sprint">
            <Button
              variant="subtle"
              color="red"
              onClick={toggle}
              size="compact-md"
            >
              <IconTrash size={16} />
            </Button>
          </Tooltip>
        ) : (
          <Button variant="subtle" color="red" onClick={toggle} size="md">
            Delete Sprint
          </Button>
        )}
      </Popover.Target>
      <Popover.Dropdown>
        <Text>Are you sure you want to delete this sprint?</Text>
        <Flex justify="end" mt="sm" gap="sm">
          <Button variant="light" onClick={close}>
            Cancel
          </Button>
          <Button
            color="red"
            disabled={deleteSprint.isMutating}
            loading={deleteSprint.isMutating}
            onClick={async () => {
              await deleteSprint.execute({
                sprintId: sprint.id,
                reference: sprint.reference,
              });
              close();
              deleteSprint.setIsMutating(false);
            }}
          >
            Delete
          </Button>
        </Flex>
      </Popover.Dropdown>
    </Popover>
  );
};
