import React, { createContext, useContext } from "react";
import { useDeliveryChartReorder } from "~/app/hooks/useDeliveryChartReorder";
import { UpdateSprintMemberOrderUseCase } from "~/app/logic/sprint/UpdateSprintMemberOrderUseCase";
import { UpdateSprintTaskOrderUseCase } from "~/app/logic/sprint/UpdateSprintTaskOrderUseCase";
import {
  type UpdateSprintMemberOrderInputType,
  type UpdateSprintTaskOrderInputType,
} from "~/server/api/schemas/sprint";
import { type GetOneProjectUseCaseType } from "~/server/logic/project/GetOneProjectUseCase";
import { type GetOneSprintUseCaseType } from "~/server/logic/sprint/GetOneSprintUseCase";
import { type GetSprintDeadlinesUseCaseType } from "~/server/logic/sprint/GetSprintDeadlinesUseCase";
import { type GetSprintMembersUseCaseType } from "~/server/logic/sprint/GetSprintMembersUseCase";
import { type GetSprintTasksUseCaseType } from "~/server/logic/sprint/GetSprintTasksUseCase";
import {
  columnCountForDays,
  createTimelineScale,
  elapsedSprintDays,
  type TimelineScale,
} from "~/shared/logic/sprint/chart/timelineScale";

export type DeliveryChartContextProps = {
  members: GetSprintMembersUseCaseType;
  localMembers: GetSprintMembersUseCaseType;
  setLocalMembers: (members: GetSprintMembersUseCaseType) => void;
  sprint: GetOneSprintUseCaseType;
  project: GetOneProjectUseCaseType;
  sprintDeadlines: GetSprintDeadlinesUseCaseType;
  allSprintTasks: GetSprintTasksUseCaseType;
  unassignedTasks: GetSprintTasksUseCaseType;
  isLoading?: boolean;
  updateTasksOrder: (
    sprintTask: UpdateSprintTaskOrderInputType,
  ) => Promise<void>;
  updateMembersOrder: (
    sprintTask: UpdateSprintMemberOrderInputType,
  ) => Promise<void>;
  isDisabled?: boolean;
  isZoomed: boolean;
  /** The day columns drawn in the header; lanes and lines use the same ones. */
  timelineDays: SprintDay[];
  scale: TimelineScale;
};

export const DeliveryChartContext =
  createContext<DeliveryChartContextProps | null>(null);

export type SprintDay = {
  day: number;
  percentage: number;
  dayOfWeek?: string;
  date: Date;
};

export const DeliveryChartProvider: React.FC<{
  members: GetSprintMembersUseCaseType;
  sprint: GetOneSprintUseCaseType;
  project: GetOneProjectUseCaseType;
  sprintDeadlines: GetSprintDeadlinesUseCaseType;
  sprintTasks?: GetSprintTasksUseCaseType;
  unassignedTasks?: GetSprintTasksUseCaseType;
  isLoading?: boolean;
  children: React.ReactNode;
  isDisabled?: boolean;
  zoomDay?: number;
}> = ({
  members: initialMembers,
  sprint,
  isLoading,
  children,
  project,
  sprintDeadlines,
  sprintTasks = [],
  unassignedTasks = [],
  isDisabled,
  zoomDay,
}) => {
  const updateSprintTaskOrder = new UpdateSprintTaskOrderUseCase();
  const updateSprintMemberOrder = new UpdateSprintMemberOrderUseCase();

  // If sprintTasks is not provided (like in snapshots), extract from members
  const allSprintTasks =
    sprintTasks.length > 0
      ? sprintTasks
      : initialMembers.flatMap((member) => member.tasks);

  // If unassignedTasks is not provided, calculate from allSprintTasks
  const calculatedUnassignedTasks =
    unassignedTasks.length > 0
      ? unassignedTasks
      : allSprintTasks.filter((task) => !task.sprintMemberId);

  const {
    localMembers,
    setLocalMembers,
    updateTasksOrder: reorderTasks,
    updateMembersOrder: reorderMembers,
  } = useDeliveryChartReorder({ members: initialMembers });

  const isZoomed = Boolean(zoomDay);

  const updateTasksOrder = async (
    sprintTask: UpdateSprintTaskOrderInputType,
  ): Promise<void> => {
    // Update local state first
    reorderTasks(sprintTask);

    // Then update server
    await updateSprintTaskOrder.execute({ sprintTask });
  };

  const updateMembersOrder = async (
    sprintMember: UpdateSprintMemberOrderInputType,
  ): Promise<void> => {
    // Update local state first
    reorderMembers(sprintMember);

    // Then update server
    await updateSprintMemberOrder.execute({ sprintMember });
  };

  const timelineDays = getTimelineDays(initialMembers, sprint);
  const scale = createTimelineScale(timelineDays.map((d) => d.day));

  return (
    <DeliveryChartContext.Provider
      value={{
        members: initialMembers,
        localMembers,
        setLocalMembers,
        sprint,
        isLoading,
        project,
        allSprintTasks,
        unassignedTasks: calculatedUnassignedTasks,
        updateTasksOrder,
        updateMembersOrder,
        sprintDeadlines,
        isDisabled,
        isZoomed,
        timelineDays,
        scale,
      }}
    >
      {children}
    </DeliveryChartContext.Provider>
  );
};

/**
 * The day columns come from the server (they already respect zoom). Old
 * snapshots were saved before the server sent them, so fall back to one
 * column per day of the longest lane / sprint.
 */
const getTimelineDays = (
  members: GetSprintMembersUseCaseType,
  sprint: GetOneSprintUseCaseType,
): SprintDay[] => {
  const fromServer = members[0]?.timelineDays;
  if (fromServer && fromServer.length > 0) {
    return fromServer.map((day) => ({
      day: day.number,
      percentage: day.percentage,
      dayOfWeek: day.dayOfWeek,
      date: day.date,
    }));
  }
  const longestLane = Math.max(
    0,
    ...members.map((m) => m.tasks.reduce((sum, t) => sum + t.days, 0)),
  );
  const count = columnCountForDays(
    Math.max(longestLane, sprint.days, elapsedSprintDays(sprint)),
  );
  return Array.from({ length: count }, (_, i) => ({
    day: i + 1,
    percentage: 100 / count,
    date: new Date(),
  }));
};

export const useDeliveryChartContext = () => {
  const context = useContext(DeliveryChartContext);
  if (!context) {
    throw new Error(
      "useDeliveryChartContext must be used within a DeliveryChartProvider",
    );
  }
  return context;
};
