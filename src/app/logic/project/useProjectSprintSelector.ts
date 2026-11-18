import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useProjectSprintQueries } from "~/app/hooks/useProjectSprintQueries";

interface ProjectSprintSelectorState {
  selectedProject: string | null;
  selectedSprint: string | null;
  focusedInput: "project" | "sprint" | null;
}

export const useProjectSprintSelector = (
  defaultProjectId?: string,
  defaultSprintId?: string,
  onSelect?: (projectId: string, sprintId?: string) => void
) => {
  const router = useRouter();
  const [opened, { close, open }] = useDisclosure(false);
  const [state, setState] = useState<ProjectSprintSelectorState>({
    selectedProject: defaultProjectId ?? null,
    selectedSprint: defaultSprintId ?? null,
    focusedInput: null,
  });

  const {
    getAllProjects,
    getProject,
    getSprint,
    getProjectSprints,
    getProjectOptions,
    getSprintOptions,
  } = useProjectSprintQueries();

  const { data: projects } = getAllProjects;
  const { data: currentProject } = getProject(Number(defaultProjectId));
  const { data: currentSprint } = getSprint(Number(defaultSprintId));
  const { data: sprints } = getProjectSprints(Number(state.selectedProject));

  const handleConfirm = () => {
    if (state.selectedProject) {
      onSelect?.(state.selectedProject, state.selectedSprint ?? undefined);

      if (state.selectedSprint) {
        router.push(
          `/projects/${state.selectedProject}/sprints/${state.selectedSprint}`
        );
      } else {
        router.push(`/projects/${state.selectedProject}`);
      }
      close();
    }
  };

  const handleProjectChange = (value: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedProject: value,
      selectedSprint: null,
    }));
  };

  const handleLinkClick = (type: "project" | "sprint") => {
    setState((prev) => ({
      ...prev,
      selectedProject: defaultProjectId ?? null,
      selectedSprint: defaultSprintId ?? null,
      focusedInput: type,
    }));
    open();
  };

  const setSelectedSprint = (value: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedSprint: value,
    }));
  };

  return {
    isOpened: opened,
    selectedProject: state.selectedProject,
    selectedSprint: state.selectedSprint,
    focusedInput: state.focusedInput,
    projects,
    currentProject,
    currentSprint,
    sprints,
    getProjectOptions,
    getSprintOptions,
    handleConfirm,
    handleProjectChange,
    handleLinkClick,
    close,
    setSelectedSprint,
  };
};
