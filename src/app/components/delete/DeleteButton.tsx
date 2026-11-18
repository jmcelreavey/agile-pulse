"use client";

import { Button, type ButtonProps } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import ConfirmationPopover from "~/app/components/base/popover/ConfirmationPopover";
import { type DeleteSource } from "~/shared/types/DeleteSource";

export const DeleteButton = ({
  recordName,
  onDelete,
  source,
  onDeleted,
  ...props
}: {
  recordName: string;
  source: DeleteSource;
  onDelete: () => Promise<void>;
  onDeleted?: () => Promise<void>;
} & ButtonProps) => {
  return (
    <ConfirmationPopover
      confirmationText={`Are you sure you want to delete this ${source.toLowerCase()}?`}
      onConfirm={async () => {
        try {
          await onDelete();

          notifications.show({
            title: `${source} ${recordName} deleted!`,
            message: `${source} ${recordName} is now deleted`,
            icon: <IconCheck size="1.1rem" />,
            autoClose: 5000,
          });

          await onDeleted?.();
        } catch (error) {
          console.error(error);
          notifications.show({
            title: `Error archiving ${recordName}`,
            message: (error as Error).message,
            icon: <IconAlertCircle size="1.1rem" />,
            color: "red",
            autoClose: 5000,
          });
        }
      }}
    >
      <Button variant="light" size="md" {...props}>
        Delete {source}
      </Button>
    </ConfirmationPopover>
  );
};
