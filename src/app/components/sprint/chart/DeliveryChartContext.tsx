import React, { createContext, useContext, useState } from "react";
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
    sprintTask: UpdateSprintTaskOrderInputType
  ) => Promise<void>;
  updateMembersOrder: (
    sprintTask: UpdateSprintMemberOrderInputType
  ) => Promise<void>;
  chartWidth: number;
  setChartWidth: (width: number) => void;
  sectionWidths: number[];
  setSectionWidths: (widths: number[]) => void;
  isDisabled?: boolean;
  isZoomed: boolean;
  maxSprintMemberTaskDays: number;
  actualSprintLength: number;
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
  const [chartWidth, setChartWidth] = useState<number>(0);
  const [sectionWidths, setSectionWidths] = useState<number[]>([]);
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
    sprintTask: UpdateSprintTaskOrderInputType
  ): Promise<void> => {
    // Update local state first
    reorderTasks(sprintTask);

    // Then update server
    await updateSprintTaskOrder.execute({ sprintTask });
  };

  const updateMembersOrder = async (
    sprintMember: UpdateSprintMemberOrderInputType
  ): Promise<void> => {
    // Update local state first
    reorderMembers(sprintMember);

    // Then update server
    await updateSprintMemberOrder.execute({ sprintMember });
  };

  const maxSprintMemberTaskDays = Math.max(
    ...localMembers.map((m) =>
      m.tasks.map((t) => t.days).reduce((a, b) => a + b, 0)
    )
  );

  const actualSprintLength = Math.max(maxSprintMemberTaskDays, sprint.days);

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
        chartWidth,
        sprintDeadlines,
        setChartWidth,
        sectionWidths,
        setSectionWidths,
        isDisabled,
        isZoomed,
        maxSprintMemberTaskDays,
        actualSprintLength,
      }}
    >
      {children}
    </DeliveryChartContext.Provider>
  );
};

export const useDeliveryChartContext = () => {
  const context = useContext(DeliveryChartContext);
  if (!context) {
    throw new Error(
      "useDeliveryChartContext must be used within a DeliveryChartProvider"
    );
  }
  return context;
};
