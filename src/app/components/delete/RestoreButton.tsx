"use client";

import { Button, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconHistory } from "@tabler/icons-react";
import { RestoreDrawer } from "~/app/components/delete/RestoreDrawer";
import { type GetDeletedRecordsUseCaseType } from "~/server/logic/deleted/GetDeletedRecordsUseCase";
import { type RestoreDeletedRecordsUseCaseType } from "~/server/logic/deleted/RestoreDeletedRecordsUseCase";
import { type DeleteSource } from "~/shared/types/DeleteSource";

export const RestoreButton = ({
  deletedRecords,
  source,
  onRestore,
}: {
  deletedRecords: GetDeletedRecordsUseCaseType;
  source: DeleteSource;
  sourceRelation?: number;
  onRestore?: (record: RestoreDeletedRecordsUseCaseType) => void;
}) => {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Tooltip label="Restore Deleted Items">
        <Button onClick={open} size="compact-md" variant="subtle">
          <IconHistory size={"16"} />
        </Button>
      </Tooltip>
      <RestoreDrawer
        onRestore={onRestore}
        source={source}
        opened={opened}
        onClose={close}
        records={deletedRecords}
      />
    </>
  );
};
