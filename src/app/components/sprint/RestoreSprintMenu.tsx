"use client";

import {
  Button,
  Menu,
  MenuDropdown,
  MenuItem,
  MenuTarget,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconHistory } from "@tabler/icons-react";
import { useState } from "react";
import { RestoreDrawer } from "~/app/components/delete/RestoreDrawer";
import { type GetDeletedRecordsUseCaseType } from "~/server/logic/deleted/GetDeletedRecordsUseCase";
import { type RestoreDeletedRecordsUseCaseType } from "~/server/logic/deleted/RestoreDeletedRecordsUseCase";
import { DeleteSource } from "~/shared/types/DeleteSource";

export const RestoreSprintMenu = ({
  deletedTasks,
  deletedMembers,
  onRestore,
}: {
  deletedTasks: GetDeletedRecordsUseCaseType;
  deletedMembers: GetDeletedRecordsUseCaseType;
  onRestore?: (record: RestoreDeletedRecordsUseCaseType) => void;
}) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [source, setSource] = useState<DeleteSource>(DeleteSource.SPRINT_TASK);

  return (
    <Menu>
      <Tooltip label="Restore Deleted Items">
        <MenuTarget>
          <Button size="compact-md" variant="subtle">
            <IconHistory size={"16"} />
          </Button>
        </MenuTarget>
      </Tooltip>
      <MenuDropdown>
        <MenuItem
          disabled={deletedTasks.length === 0}
          onClick={() => {
            setSource(DeleteSource.SPRINT_TASK);
            open();
          }}
        >
          Deleted Tasks
        </MenuItem>
        <MenuItem
          disabled={deletedMembers.length === 0}
          onClick={() => {
            setSource(DeleteSource.SPRINT_MEMBER);
            open();
          }}
        >
          Deleted Members
        </MenuItem>
      </MenuDropdown>
      <RestoreDrawer
        onRestore={onRestore}
        source={source}
        opened={opened}
        onClose={close}
        records={
          source === DeleteSource.SPRINT_TASK ? deletedTasks : deletedMembers
        }
      />
    </Menu>
  );
};
