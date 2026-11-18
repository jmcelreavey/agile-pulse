import { type NotificationProps } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";

/**
 * Shows a notification with the given title and message.
 *
 * @param title The title of the notification.
 * @param message The message of the notification.
 * @param isError Whether the notification is an error.
 * @param autoClose The time in milliseconds before the notification is
 * automatically closed.
 */
export const ShowNotificationUtil = ({
  title,
  message,
  isError = false,
  autoClose = 2000,
  ...rest
}: {
  title?: string;
  message: string;
  isError?: boolean;
  autoClose?: number;
} & NotificationProps) => {
  if (isError) {
    console.error(message);
  }

  const color = isError ? "red" : "";
  const icon = isError ? (
    <IconAlertCircle size="1.1rem" />
  ) : (
    <IconCheck size="1.1rem" />
  );
  notifications.show({
    title,
    message,
    icon,
    autoClose,
    color,
    ...rest,
  });
};
