import { useEffect, useState } from "react";
import { State } from "~/shared/types/State";
import { api } from "~/trpc/react";

export const useSprintTaskSelection = (sprintId: number) => {
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);

  // Fetch sprint tasks
  const sprintTasksQuery = api.sprint.getTasks.useQuery({
    sprintId,
  });

  // Initialize with completed tasks selected by default
  useEffect(() => {
    if (sprintTasksQuery.data) {
      const completedTaskIds = sprintTasksQuery.data
        .filter((task) => task.state === State.COMPLETED)
        .map((task) => task.id);
      setSelectedTasks(completedTaskIds);
    }
  }, [sprintTasksQuery.data]);

  const handleTaskToggle = (taskId: number) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (sprintTasksQuery.data) {
      setSelectedTasks(sprintTasksQuery.data.map((task) => task.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedTasks([]);
  };

  return {
    sprintTasks: sprintTasksQuery.data,
    isLoading: sprintTasksQuery.isLoading,
    error: sprintTasksQuery.error,
    selectedTasks,
    setSelectedTasks,
    handleTaskToggle,
    handleSelectAll,
    handleDeselectAll,
    // Expose refetch for prefetching
    refetch: sprintTasksQuery.refetch,
  };
};
