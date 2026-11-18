import { Draggable, Droppable } from "@hello-pangea/dnd";
import {
  Box,
  Card,
  Group,
  ProgressRoot,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { type FC } from "react";
import { LANE_PADDING } from "~/app/components/sprint/chart/chartLayout";
import { useDeliveryChartContext } from "~/app/components/sprint/chart/DeliveryChartContext";
import { DeliveryChartTaskProgress } from "~/app/components/sprint/chart/DeliveryChartTaskProgress";
import UpdateSprintMemberModal from "~/app/components/sprint/member/UpdateSprintMemberModal";
import classes from "~/app/styles/DeliveryChart.module.css";
import { type GetSprintMembersUseCaseType } from "~/server/logic/sprint/GetSprintMembersUseCase";
import { getStateColour } from "~/shared/types/State";

export const DeliveryChartMemberCard: FC<{
  member: GetSprintMembersUseCaseType[0];
  sprintTasks: GetSprintMembersUseCaseType[0]["tasks"];
}> = ({ member, sprintTasks }) => {
  const [opened, { open, close }] = useDisclosure(false);
  const { sprint, updateMembersOrder, isDisabled } = useDeliveryChartContext();

  // Sort tasks by order before rendering
  const sortedTasks = [...sprintTasks].sort((a, b) => a.order - b.order);

  return (
    <Card mb={8} withBorder shadow="md" p={LANE_PADDING}>
      <Box>
        <Box>
          <Text mb={4} size="md" fw={500}>
            <UnstyledButton disabled={isDisabled} onClick={open}>
              {member.name}:
            </UnstyledButton>
          </Text>
        </Box>
        <Group w="100%">
          <Droppable
            type="TASK"
            droppableId={member.id.toString()}
            direction="horizontal"
          >
            {(provided) => (
              <ProgressRoot
                size={50}
                w="100%"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {sortedTasks.map((task, index) => (
                  <Draggable
                    key={task.id}
                    draggableId={task.id.toString()}
                    isDragDisabled={isDisabled}
                    index={index}
                  >
                    {(provided) => (
                      <DeliveryChartTaskProgress
                        provided={provided}
                        className={classes.chartTask}
                        value={task.percentage}
                        color={getStateColour(task.state)}
                        task={task}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ProgressRoot>
            )}
          </Droppable>
          {sprintTasks.length === 0 && <Text size="sm">No tasks assigned</Text>}
        </Group>
      </Box>
      <UpdateSprintMemberModal
        sprintMember={member}
        opened={opened}
        onClose={close}
        onMemberUpdate={(member) =>
          updateMembersOrder({
            sprintId: sprint.id,
            sprintMemberId: member.id,
            order: member.order,
          })
        }
      />
    </Card>
  );
};
