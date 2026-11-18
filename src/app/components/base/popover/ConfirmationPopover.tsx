import { Button, Flex, Popover, Text } from "@mantine/core";
import { type PropsWithChildren, useState } from "react";
import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";

interface ConfirmationPopoverProps {
  confirmationText: string;
  successText?: string;
  errorText?: string;
  onConfirm: () => Promise<void>;
  onConfirmed?: () => void;
}

const ConfirmationPopover = ({
  confirmationText,
  successText,
  errorText,
  onConfirm,
  onConfirmed,
  children,
}: PropsWithChildren<ConfirmationPopoverProps>) => {
  const [opened, setOpened] = useState(false);

  return (
    <Popover position="bottom" shadow="md" opened={opened} onChange={setOpened}>
      <Popover.Target>
        <div onClick={() => setOpened((o) => !o)}>{children}</div>
      </Popover.Target>
      <Popover.Dropdown>
        <Text>{confirmationText}</Text>
        <Flex justify="end" mt="sm" gap="sm">
          <Button variant="default" onClick={() => setOpened((o) => !o)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={async () => {
              try {
                await onConfirm();

                if (successText) {
                  ShowNotificationUtil({
                    message: successText,
                  });
                }

                onConfirmed?.();
              } catch (error) {
                const errorInstance = error as Error;

                if (errorText) {
                  ShowNotificationUtil({
                    message: errorText,
                    isError: true,
                  });
                } else {
                  throw errorInstance;
                }
              }
              setOpened((o) => !o);
            }}
          >
            Confirm
          </Button>
        </Flex>
      </Popover.Dropdown>
    </Popover>
  );
};

export default ConfirmationPopover;
