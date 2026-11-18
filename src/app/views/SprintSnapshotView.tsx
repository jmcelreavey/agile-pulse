"use client";

import { Box, Button, Divider, Stack } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import CollapsibleRichTextEditor from "~/app/components/base/CollapsibleRichTextEditor";
import { EntityHeader } from "~/app/components/shared/EntityHeader";
import { DeliveryChart } from "~/app/components/sprint/chart/DeliveryChart";
import { SprintNavigationButtons } from "~/app/components/sprint/SprintNavigationButtons";
import { SprintSnapshotSlider } from "~/app/components/sprint/SprintSnapshotSlider";
import { useSprintSnapshotQueries } from "~/app/hooks/useSprintSnapshotQueries";

export const SprintSnapshotView = ({
  sprintId,
  projectId,
}: {
  sprintId: number;
  projectId: number;
}) => {
  const { project, isLoading, previousSprint, nextSprint, sprintSnapshots } =
    useSprintSnapshotQueries({
      sprintId,
      projectId,
    });
  const [currentSnapshotIndex, setCurrentSnapshotIndex] = useState(
    sprintSnapshots.length - 1
  );

  // Memoize the current snapshot data
  const currentSnapshotData = useMemo(() => {
    if (!sprintSnapshots[currentSnapshotIndex]) return null;
    return {
      sprint: sprintSnapshots[currentSnapshotIndex].sprint,
      sprintMembers: sprintSnapshots[currentSnapshotIndex].sprintMembers,
      sprintDeadlines: sprintSnapshots[currentSnapshotIndex].sprintDeadlines,
    };
  }, [sprintSnapshots, currentSnapshotIndex]);

  if (!currentSnapshotData) return null;

  return (
    <Box>
      <SprintNavigationButtons
        projectId={projectId}
        previousSprintId={previousSprint?.id}
        nextSprintId={nextSprint?.id}
      />

      {/* Back to Sprint Button */}
      <Box>
        <Button
          component={Link}
          href={`/projects/${projectId}/sprints/${sprintId}`}
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          size="sm"
        >
          Back to Sprint
        </Button>
      </Box>

      <Stack>
        <EntityHeader
          entity={{
            name: project.name,
            state: currentSnapshotData.sprint.state,
            colour: project.colour,
            description: project.description,
            startedAt: currentSnapshotData.sprint.startedAt,
          }}
          type="sprint"
          subtitle={currentSnapshotData.sprint.reference}
          showDate={true}
        />
        <Box pos="relative" py={32}>
          <Stack gap="lg">
            <CollapsibleRichTextEditor
              title="Sprint Notes (Snapshot)"
              locked={true}
              initialContent={currentSnapshotData.sprint.notes ?? ""}
              placeholder="Sprint snapshot information and details."
              onSave={async () => {
                console.error("Locked");
              }}
            />
            <SprintSnapshotSlider
              sprintSnapshots={sprintSnapshots}
              onSnapshotChange={(index: number) => {
                setCurrentSnapshotIndex(index);
              }}
            />
          </Stack>
          <Divider my={38} />
          <DeliveryChart
            sprintDeadlines={currentSnapshotData.sprintDeadlines}
            isLoading={isLoading}
            project={project}
            sprint={currentSnapshotData.sprint}
            members={currentSnapshotData.sprintMembers}
            isDisabled={true}
          />
        </Box>
      </Stack>
    </Box>
  );
};
