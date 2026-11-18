"use client";

import { Button, Flex, Popover, Select, Stack, Text } from "@mantine/core";
import { useProjectSprintSelector } from "~/app/logic/project/useProjectSprintSelector";

interface ProjectSprintSelectorProps {
  onSelect?: (projectId: string, sprintId?: string) => void;
  defaultProjectId?: string;
  defaultSprintId?: string;
}

export const ProjectSprintSelector = ({
  onSelect,
  defaultProjectId,
  defaultSprintId,
}: ProjectSprintSelectorProps) => {
  const selector = useProjectSprintSelector(
    defaultProjectId,
    defaultSprintId,
    onSelect
  );

  const projectOptions = selector.getProjectOptions(selector.projects);
  const sprintOptions = selector.getSprintOptions(selector.sprints);

  return (
    <Flex align="center" gap={4}>
      <Popover
        key={selector.focusedInput} // Add key to force re-render
        opened={selector.isOpened}
        onChange={(opened) => {
          if (!opened) selector.close();
        }}
        width={300}
        position="bottom"
        withArrow
        shadow="md"
        closeOnClickOutside
        middlewares={{ shift: true, flip: true }}
      >
        <Popover.Target>
          <Flex align="center">
            <Flex align="center" gap="xs">
              <Button
                variant="light"
                onClick={() => selector.handleLinkClick("project")}
              >
                <Text component="span" size="sm" fw={500}>
                  {selector.currentProject?.name ?? "Select Project"}
                </Text>
              </Button>

              {(selector.currentProject || selector.currentSprint) && (
                <>
                  <Text
                    component="span"
                    size="sm"
                    c="dimmed"
                    style={{ margin: "0 4px" }}
                  >
                    /
                  </Text>
                  <Button
                    variant="light"
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      selector.handleLinkClick("sprint");
                    }}
                  >
                    <Text component="span" size="sm" fw={500}>
                      {selector.currentSprint?.reference ?? "Select Sprint"}
                    </Text>
                  </Button>
                </>
              )}
            </Flex>
          </Flex>
        </Popover.Target>

        <Popover.Dropdown>
          <Stack>
            <Select
              label="Project"
              placeholder="Select a project"
              data={projectOptions}
              value={selector.selectedProject}
              onChange={selector.handleProjectChange}
              autoFocus={selector.focusedInput === "project"}
              searchable
              comboboxProps={{ withinPortal: false }}
            />
            <Select
              label="Sprint"
              placeholder="Select a sprint"
              data={sprintOptions}
              value={selector.selectedSprint}
              onChange={selector.setSelectedSprint}
              autoFocus={selector.focusedInput === "sprint"}
              disabled={!selector.selectedProject}
              searchable
              comboboxProps={{ withinPortal: false }}
            />
            <Button
              onClick={selector.handleConfirm}
              disabled={!selector.selectedProject}
            >
              Confirm
            </Button>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </Flex>
  );
};
