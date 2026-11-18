"use client";

import {
  Box,
  Button,
  Card,
  Divider,
  Drawer,
  DrawerBody,
  Flex,
  Group,
  Stack,
  Text,
  type DrawerProps,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { type GetDeletedRecordsUseCaseType } from "~/server/logic/deleted/GetDeletedRecordsUseCase";
import { type RestoreDeletedRecordsUseCaseType } from "~/server/logic/deleted/RestoreDeletedRecordsUseCase";
import { DeleteSource } from "~/shared/types/DeleteSource";
import { api } from "~/trpc/react";

export const RestoreDrawer = ({
  records,
  source,
  onRestore,
  ...props
}: {
  records: GetDeletedRecordsUseCaseType;
  source: DeleteSource;
  onRestore?: (record: RestoreDeletedRecordsUseCaseType) => void;
} & DrawerProps) => {
  const restoreDeletedRecord = api.deleted.restoreDeletedRecords.useMutation();

  return (
    <Drawer {...props} offset={8} radius={"sm"} title={`Deleted ${source}s`}>
      <DrawerBody>
        {records.length === 0 && (
          <Card my={"md"} shadow="lg" p="lg">
            <Text>No deleted records found</Text>
          </Card>
        )}
        {records.map((record, i) => (
          <Card my={"md"} key={i} shadow="lg" p="lg">
            <Stack>
              <Group justify="space-between">
                <Text component="span">
                  <strong>Record Name:</strong>
                </Text>
                <Text component="span">{record.name}</Text>
              </Group>
              <Group justify="space-between">
                <Text component="span">
                  <strong>Deleted On:</strong>
                </Text>
                <Text component="span">
                  {record.deletedAt.toLocaleDateString()}
                </Text>
              </Group>
              {record.reason && (
                <Group justify="space-between">
                  <Text component="span">
                    <strong>Reason:</strong>
                  </Text>
                  <Text component="span">{record.reason}</Text>
                </Group>
              )}
              <Group justify="space-between">
                <Text component="span">
                  <strong>Contains:</strong>
                </Text>
                <Box w={"70%"}>
                  {Object.values(DeleteSource)
                    .map((value, i) => {
                      const total = record[value];

                      if (total === 0) {
                        return null;
                      }

                      return (
                        <Box key={i} mb="xs">
                          <Flex justify={"space-between"}>
                            <Text component="span" fw="bold">
                              {value}
                            </Text>
                            <Text component="span">{total}</Text>
                          </Flex>
                        </Box>
                      );
                    })
                    .filter((value) => value !== null)}
                </Box>
              </Group>
              <Divider my="sm" />
              <Button
                loading={restoreDeletedRecord.isPending}
                variant="outline"
                onClick={async () => {
                  const restoredRecord = await restoreDeletedRecord.mutateAsync(
                    {
                      source,
                      id: record.id,
                    }
                  );

                  onRestore?.(restoredRecord);

                  notifications.show({
                    title: `${record.name} restored!`,
                    message: `${record.name} is now restored`,
                    icon: <IconCheck size="1.1rem" />,
                    autoClose: 5000,
                  });
                }}
              >
                Restore
              </Button>
            </Stack>
          </Card>
        ))}
      </DrawerBody>
    </Drawer>
  );
};
