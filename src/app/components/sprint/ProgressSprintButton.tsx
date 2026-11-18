"use client";

import { Button, Flex, Popover, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ProgressSprintUseCase } from "~/app/logic/sprint/ProgressSprintUseCase";
import { type GetOneSprintUseCaseType } from "~/server/logic/sprint/GetOneSprintUseCase";
import { State } from "~/shared/types/State";

export const ProgressSprintButton = ({
  sprint,
}: {
  sprint: GetOneSprintUseCaseType;
}) => {
  const progressSprint = new ProgressSprintUseCase();

  const [opened, { toggle, close }] = useDisclosure();

  return (
    <Popover position="bottom" shadow="md" opened={opened} onChange={toggle}>
      <Popover.Target>
        <Button
          variant="light"
          disabled={sprint.state === State.COMPLETED}
          onClick={toggle}
          size="md"
        >
          Progress Sprint
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Text>Progress sprint to the next day?</Text>
        <Flex justify="end" mt="sm" gap="sm">
          <Button variant="light" onClick={close}>
            Cancel
          </Button>
          <Button
            color="red"
            autoFocus
            loading={
              progressSprint.mutation.isPending || progressSprint.isMutating
            }
            disabled={
              progressSprint.mutation.isPending || progressSprint.isMutating
            }
            onClick={async () => {
              await progressSprint.execute({
                sprintId: sprint.id,
                reference: sprint.reference,
              });

              close();

              progressSprint.setIsMutating(false);
            }}
          >
            Progress
          </Button>
        </Flex>
      </Popover.Dropdown>
    </Popover>
  );
};
