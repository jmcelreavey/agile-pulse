"use client";

import { Button, Flex, Popover, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { AsyncAutocomplete } from "~/app/components/base/select/AsyncAutoComplete";
import { useSprintTaskQueries } from "~/app/hooks/useSprintTaskQueries";
import { MoveOverrunningTasksUseCase } from "~/app/logic/sprint/MoveOverrunningTasksUseCase";
import { type GetOneSprintUseCaseType } from "~/server/logic/sprint/GetOneSprintUseCase";

export const MoveOverrunningTasksButton = ({
  sprint,
  projectId,
}: {
  sprint: GetOneSprintUseCaseType;
  projectId: number;
}) => {
  const [opened, { toggle, close }] = useDisclosure();
  const [selectedSprint, setSelectedSprint] = useState<{
    id: number;
    reference: string;
  } | null>(null);
  const moveOverrunningTasks = new MoveOverrunningTasksUseCase();
  const { fetchSprintData } = useSprintTaskQueries({
    sprintId: sprint.id,
    projectId,
  });

  return (
    <Popover position="bottom" shadow="md" opened={opened} onChange={toggle}>
      <Popover.Target>
        <Button variant="light" onClick={toggle} size="md">
          Move Overruns
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Text mb="sm">Select a sprint to move overrunning tasks to:</Text>
        <AsyncAutocomplete
          fetchData={fetchSprintData}
          initialValue=""
          renderOption={(item) => <span>{item.reference}</span>}
          getOptionValue={(item) => item.reference}
          label="Target Sprint"
          placeholder="Search sprints..."
          withAsterisk
          onOptionSelect={(item) => {
            setSelectedSprint({ id: item.id, reference: item.reference });
          }}
          onChange={() => setSelectedSprint(null)}
        />
        <Flex justify="end" mt="sm" gap="sm">
          <Button variant="light" onClick={close}>
            Cancel
          </Button>
          <Button
            color="blue"
            disabled={moveOverrunningTasks.isMutating || !selectedSprint}
            loading={moveOverrunningTasks.isMutating}
            onClick={async () => {
              if (selectedSprint) {
                await moveOverrunningTasks.execute({
                  sourceSprintId: sprint.id,
                  targetSprintId: selectedSprint.id,
                  sourceReference: sprint.reference,
                  targetReference: selectedSprint.reference,
                });
                close();
                moveOverrunningTasks.setIsMutating(false);
              }
            }}
          >
            Move Tasks
          </Button>
        </Flex>
      </Popover.Dropdown>
    </Popover>
  );
};
