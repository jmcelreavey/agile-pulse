import { useMantineTheme, type MantineTheme } from "@mantine/core";
import {
    IconExternalLink,
    IconPencil,
    IconTrash,
    IconUserMinus,
    IconUserPlus,
} from "@tabler/icons-react";
import { useContextMenu } from "mantine-contextmenu";
import { SiJira } from "react-icons/si";
import { useDeliveryChartContext } from "~/app/components/sprint/chart/DeliveryChartContext";
import { UpdateSprintTaskUseCase } from "~/app/logic/sprint/UpdateSprintTaskUseCase";
import { DeleteTaskUseCase } from "~/app/logic/task/DeleteTaskUseCase";
import { UnassignTaskUseCase } from "~/app/logic/task/UnassignTaskUseCase";
import { type GetSprintTasksUseCaseType } from "~/server/logic/sprint/GetSprintTasksUseCase";
import { GetJiraURLUtil } from "~/shared/logic/jira/GetJiraTaskURLUtil";
import { State, getStateColour, getStateIcon } from "~/shared/types/State";
import { api } from "~/trpc/react";

const getColorFromTheme = (theme: MantineTheme, colorKey: string): string => {
  const [color, shade] = colorKey.split(".");
  const colorShade = Number(shade);

  if (
    color &&
    shade &&
    theme.colors[color]?.[colorShade]
  ) {
    return theme.colors[color]?.[colorShade] ?? "";
  }

  return theme.colors.gray[5];
};

interface UseTaskContextMenuProps {
  task: GetSprintTasksUseCaseType[0];
  onEdit: () => void;
}

export const useTaskContextMenu = ({
  task,
  onEdit,
}: UseTaskContextMenuProps) => {
  const { sprint, localMembers, isDisabled, project } =
    useDeliveryChartContext();
  const { showContextMenu } = useContextMenu();
  const updateSprintTask = new UpdateSprintTaskUseCase();
  const unassignTaskUseCase = new UnassignTaskUseCase();
  const deleteTaskUseCase = new DeleteTaskUseCase();
  const theme = useMantineTheme();
  const isComplete = sprint.state === State.COMPLETED;
  const jiraConnectionStatus = api.jira.getConnectionStatus.useQuery();

  // Generate Jira URL if task has jiraIssueKey and project is linked to Jira
  const jiraUrl =
    task.jiraIssueKey &&
    project.jiraProjectKey &&
    jiraConnectionStatus.data?.domain &&
    jiraConnectionStatus.data?.isConnected
      ? GetJiraURLUtil({
          key: task.jiraIssueKey,
          domain: jiraConnectionStatus.data.domain || "",
        })
      : "";

  const handleStateUpdate = async (newState: State) => {
    await updateSprintTask.execute({
      sprintTask: {
        id: task.id,
        sprintId: task.sprintId,
        name: task.name,
        description: task.description,
        days: task.days,
        state: newState,
        memberId: task.memberId,
        memberName: task.memberName,
      },
      reference: task.name,
    });
  };

  const handleAssignToMember = async (memberId: number, memberName: string) => {
    await updateSprintTask.execute({
      sprintTask: {
        id: task.id,
        sprintId: task.sprintId,
        name: task.name,
        description: task.description,
        days: task.days,
        state: task.state,
        memberId: memberId,
        memberName: memberName,
      },
      reference: task.name,
    });
  };

  const handleUnassignTask = async () => {
    await unassignTaskUseCase.execute(task.id);
  };

  const handleDeleteTask = async () => {
    await deleteTaskUseCase.execute(task.id);
  };

  const getStateMenuItems = () => {
    return Object.values(State).map((state) => {
      const StateIcon = getStateIcon(state);
      const colorKey = getStateColour(state);
      const actualColor = getColorFromTheme(theme, colorKey);

      return {
        key: `${task.id}-state-${state.toLowerCase()}`,
        title: `Set ${state}`,
        icon: <StateIcon size={16} color={actualColor} />,
        onClick: () => void handleStateUpdate(state),
        disabled: task.state === state || isComplete || isDisabled,
      };
    });
  };

  const getAssignmentMenuItems = () => {
    return localMembers.map((member) => ({
      key: `${task.id}-assign-${member.id}`,
      title: member.name,
      onClick: () => void handleAssignToMember(member.id, member.name),
      disabled: isDisabled || isComplete || task.memberId === member.id,
    }));
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const menuItems = [
      ...getStateMenuItems(),
      { key: `${task.id}-divider-1` },
      {
        key: `${task.id}-assign`,
        title: "Assign To",
        icon: <IconUserPlus size={16} />,
        disabled: isDisabled || isComplete || localMembers.length === 0,
        items: getAssignmentMenuItems(),
      },
      ...(task.memberId
        ? [
            {
              key: `${task.id}-unassign`,
              title: "Unassign Member",
              icon: <IconUserMinus size={16} />,
              onClick: () => void handleUnassignTask(),
              disabled: isComplete || isDisabled,
            },
          ]
        : []),
      { key: `${task.id}-divider-2` },
      {
        key: `${task.id}-edit`,
        title: "Edit Task",
        icon: <IconPencil size={16} />,
        onClick: () => onEdit(),
        disabled: isComplete || isDisabled,
      },
      {
        key: `${task.id}-delete`,
        title: "Delete Task",
        icon: <IconTrash size={16} color={theme.colors.red[6]} />,
        onClick: () => void handleDeleteTask(),
        disabled: isComplete || isDisabled,
      },
      { key: `${task.id}-divider-3` },
      ...(task.ticketUrl
        ? [
            {
              key: `${task.id}-external-link`,
              title: "Open Ticket",
              icon: <IconExternalLink size={16} />,
              onClick: () => window.open(task.ticketUrl ?? "", "_blank"),
            },
          ]
        : []),
      ...(jiraUrl
        ? [
            {
              key: `${task.id}-jira-link`,
              title: "Open in Jira",
              icon: <SiJira size={16} />,
              onClick: () => window.open(jiraUrl, "_blank"),
            },
          ]
        : []),
    ];

    showContextMenu(menuItems)(event);
  };

  return {
    handleContextMenu,
  };
};
