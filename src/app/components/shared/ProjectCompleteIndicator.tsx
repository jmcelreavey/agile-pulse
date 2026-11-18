"use client";

import { Group, Popover, Text, useMantineColorScheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconRosetteDiscountCheck } from "@tabler/icons-react";

export const ProjectCompleteIndicator = ({
  startedAt,
  completedAt,
}: {
  startedAt?: Date | null;
  completedAt?: Date | null;
}) => {
  const [opened, { close, open }] = useDisclosure(false);
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Popover
      width={350}
      position="bottom"
      withArrow
      shadow="md"
      opened={opened && Boolean(completedAt)}
    >
      <Popover.Target>
        <IconRosetteDiscountCheck
          onMouseEnter={open}
          onMouseLeave={close}
          fill={isDark ? "black" : "white"}
          color={isDark ? "white" : "black"}
        />
      </Popover.Target>
      <Popover.Dropdown style={{ pointerEvents: "none" }}>
        <Group justify="space-between">
          <Text size="md" fw={"bold"}>
            Started on:
          </Text>
          <Text size="md">{startedAt?.toLocaleDateString()}</Text>
          <Text size="md" fw={"bold"}>
            Completed on:
          </Text>
          <Text size="md">{completedAt?.toLocaleDateString()}</Text>
        </Group>
      </Popover.Dropdown>
    </Popover>
  );
};
