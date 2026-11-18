"use client";

import { Button, Flex, Popover, Text } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import dayjs from "dayjs";
import { UpstartSprintUseCase } from "~/app/logic/sprint/UpstartSprintUseCase";
import { type GetOneSprintUseCaseType } from "~/server/logic/sprint/GetOneSprintUseCase";
import { State } from "~/shared/types/State";

export const StartSprintButton = ({
  sprint,
}: {
  sprint: GetOneSprintUseCaseType;
}) => {
  const upstartSprint = new UpstartSprintUseCase();
  const [opened, { toggle, close }] = useDisclosure();
  const today = dayjs().toDate();

  const form = useForm({
    initialValues: {
      startedAt: sprint.startedAt || today,
    },
    validate: {
      startedAt: (value) => {
        if (value > today) {
          return "Start date cannot be in the future";
        }
        return null;
      },
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    void (async () => {
      await upstartSprint.execute({
        id: sprint.id,
        reference: sprint.reference,
        startedAt: values.startedAt,
      });

      close();
      upstartSprint.setIsMutating(false);
    })();
  });

  const buttonText =
    sprint.state === State.NOT_STARTED
      ? "Start Sprint"
      : "Update Sprint Start Date";

  return (
    <Popover position="bottom" shadow="md" opened={opened} onChange={toggle}>
      <Popover.Target>
        <Button
          variant="light"
          disabled={sprint.state === State.COMPLETED}
          onClick={() => {
            toggle();
          }}
          size="md"
        >
          {buttonText}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <form onSubmit={handleSubmit}>
          <Text mb="sm">
            {sprint.state === State.NOT_STARTED
              ? "Select a start date for this sprint:"
              : "Update the start date for this sprint:"}
          </Text>
          <DateInput
            popoverProps={{ withinPortal: false }}
            label="Start Date"
            placeholder="Pick a date"
            {...form.getInputProps("startedAt")}
          />
          <Flex justify="end" mt="sm" gap="sm">
            <Button variant="light" onClick={close}>
              Cancel
            </Button>
            <Button
              color="red"
              disabled={upstartSprint.isMutating}
              loading={upstartSprint.isMutating}
              type="submit"
            >
              {sprint.state === State.NOT_STARTED ? "Start" : "Update"}
            </Button>
          </Flex>
        </form>
      </Popover.Dropdown>
    </Popover>
  );
};
