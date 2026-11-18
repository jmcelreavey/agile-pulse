"use client";

import { Button, Flex, Popover, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconTrash } from "@tabler/icons-react";
import { DeleteProjectUseCase } from "~/app/logic/project/DeleteProjectUseCase";
import { type GetOneProjectUseCaseType } from "~/server/logic/project/GetOneProjectUseCase";

export const DeleteProjectButton = ({
  project,
  variant = "default",
}: {
  project: GetOneProjectUseCaseType;
  variant?: "default" | "icon-only";
}) => {
  const deleteProject = new DeleteProjectUseCase();
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <Popover position="bottom" shadow="md" opened={opened} onChange={toggle}>
      <Popover.Target>
        {variant === "icon-only" ? (
          <Tooltip label="Delete Project">
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
          <Button variant="light" size="md" onClick={toggle}>
            Delete Project
          </Button>
        )}
      </Popover.Target>
      <Popover.Dropdown>
        <Text>Are you sure you want to delete this project?</Text>
        <Flex justify="end" mt="sm" gap="sm">
          <Button variant="light" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={deleteProject.isMutating}
            loading={deleteProject.isMutating}
            color="red"
            onClick={async () => {
              await deleteProject.execute({
                projectId: project.id,
                reference: project.name,
              });

              close();

              deleteProject.setIsMutating(false);
            }}
          >
            Delete
          </Button>
        </Flex>
      </Popover.Dropdown>
    </Popover>
  );
};
