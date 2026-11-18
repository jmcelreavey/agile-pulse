"use client";

import { Paper, Slider, Stack, Text } from "@mantine/core";
import { type GetSprintSnapshotUseCaseType } from "~/server/logic/snapshot/GetSprintSnapshotUseCase";

export const SprintSnapshotSlider = ({
  sprintSnapshots,
  onSnapshotChange,
}: {
  sprintSnapshots: GetSprintSnapshotUseCaseType;
  onSnapshotChange: (index: number) => void;
}) => {
  const step =
    sprintSnapshots.length > 1 ? 100 / (sprintSnapshots.length - 1) : 100;
  const marks = sprintSnapshots.map((snapshot, index) => ({
    value: index * step,
    label: snapshot.details,
  }));

  return (
    <Paper shadow="lg" p={"md"} withBorder>
      <Stack justify="center" gap="md">
        <Text>Snapshots</Text>
        <Slider
          size="lg"
          radius="xs"
          defaultValue={100}
          label={(val) => marks.find((mark) => mark.value === val)?.label}
          onChange={(value) => {
            const index = Math.round(value / step);
            if (sprintSnapshots[index]) {
              onSnapshotChange(index);
            }
          }}
          step={step}
          marks={marks}
          styles={{ markLabel: { display: "none" } }}
        />
      </Stack>
    </Paper>
  );
};
