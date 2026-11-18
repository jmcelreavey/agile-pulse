"use client";

import { Button, Flex, Popover, Text } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import dayjs from "dayjs";
import { CompleteProjectUseCase } from "~/app/logic/project/CompleteProjectUseCase";
import { type GetOneProjectUseCaseType } from "~/server/logic/project/GetOneProjectUseCase";
import { State } from "~/shared/types/State";

export const CompleteProjectButton = ({
  project,
  onComplete,
}: {
  project: GetOneProjectUseCaseType;
  onComplete: () => void;
}) => {
  const completeProject = new CompleteProjectUseCase();
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
      await completeProject.execute({
        projectId: project.id,
        reference: project.name,
        completedAt: values.completedAt,
      });

      close();
      completeProject.setIsMutating(false);
      onComplete(); // Call this to refresh the project data
    })();
  });

  return (
    <Popover position="bottom" shadow="md" opened={opened} onChange={toggle}>
      <Popover.Target>
        <Button
          variant="light"
          disabled={project.state === State.COMPLETED}
          size="md"
          onClick={toggle}
        >
          Complete Project
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <form onSubmit={handleSubmit}>
          <Text mb="sm">Select a completion date for this project:</Text>
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
              disabled={completeProject.isMutating}
              loading={completeProject.isMutating}
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
