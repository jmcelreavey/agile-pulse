"use client";

import { Button, Flex, Popover, Text } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import dayjs from "dayjs";
import { StartProjectUseCase } from "~/app/logic/project/StartProjectUseCase";
import { type GetOneProjectUseCaseType } from "~/server/logic/project/GetOneProjectUseCase";
import { State } from "~/shared/types/State";

export const StartProjectButton = ({
  project,
}: {
  project: GetOneProjectUseCaseType;
}) => {
  const startProject = new StartProjectUseCase();
  const [opened, { toggle, close }] = useDisclosure();
  const today = dayjs().toDate();

  const form = useForm({
    initialValues: {
      startedAt: today,
    },
    validate: {
      startedAt: (value) => {
        if (value > today) {
          return "Start date cannot be in the future";
        }
        return false;
      },
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    void (async () => {
      await startProject.execute({
        id: project.id,
        reference: project.name,
        startedAt: values.startedAt,
      });

      close();
      startProject.setIsMutating(false);
    })();
  });

  return (
    <Popover position="bottom" shadow="md" opened={opened} onChange={toggle}>
      <Popover.Target>
        <Button
          variant="light"
          disabled={project.state !== State.NOT_STARTED}
          size="md"
          onClick={toggle}
        >
          Start Project
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <form onSubmit={handleSubmit}>
          <Text mb="sm">Select a start date for this project:</Text>
          <DateInput
            popoverProps={{ withinPortal: false }}
            label="Start Date"
            placeholder="Pick a date"
            {...form.getInputProps("startedAt")}
          />
          <Flex justify="end" mt="sm" gap="sm">
            <Button variant="light" onClick={close} type="button">
              Cancel
            </Button>
            <Button
              color="red"
              disabled={startProject.isMutating}
              loading={startProject.isMutating}
              type="submit"
            >
              Start
            </Button>
          </Flex>
        </form>
      </Popover.Dropdown>
    </Popover>
  );
};
