"use client";

import { Button, Flex, Popover, Text } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import dayjs from "dayjs";
import { CompleteSprintUseCase } from "~/app/logic/sprint/CompleteSprintUseCase";
import { type GetOneSprintUseCaseType } from "~/server/logic/sprint/GetOneSprintUseCase";
import { State } from "~/shared/types/State";

export const CompleteSprintButton = ({
  sprint,
  onComplete,
}: {
  sprint: GetOneSprintUseCaseType;
  onComplete: () => void;
}) => {
  const completeSprint = new CompleteSprintUseCase();

  const [opened, { toggle, close }] = useDisclosure();
  const today = dayjs().toDate();

  const form = useForm({
    initialValues: {
      completedAt: today,
    },
    validate: {
      completedAt: (value) => {
        if (value > today) {
          return "Completion date cannot be in the future";
        }

        return false;
      },
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    void (async () => {
      await completeSprint.execute({
        sprintId: sprint.id,
        reference: sprint.reference,
        completedAt: values.completedAt,
      });

      close();
      completeSprint.setIsMutating(false);
      onComplete();
    })();
  });

  return (
    <Popover position="bottom" shadow="md" opened={opened} onChange={toggle}>
      <Popover.Target>
        <Button
          variant="light"
          disabled={sprint.state === State.COMPLETED}
          onClick={toggle}
          size="md"
        >
          Complete Sprint
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <form onSubmit={handleSubmit}>
          <Text mb="sm">Select a completion date for this sprint:</Text>
          <DateInput
            popoverProps={{ withinPortal: false }}
            label="Completion Date"
            placeholder="Pick a date"
            {...form.getInputProps("completedAt")}
          />
          <Flex justify="end" mt="sm" gap="sm">
            <Button variant="light" onClick={close} type="button">
              Cancel
            </Button>
            <Button
              loading={completeSprint.isMutating}
              disabled={completeSprint.isMutating}
              color="red"
              type="submit"
            >
              Complete
            </Button>
          </Flex>
        </form>
      </Popover.Dropdown>
    </Popover>
  );
};
