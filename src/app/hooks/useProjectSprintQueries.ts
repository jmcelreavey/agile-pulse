import { api } from "~/trpc/react";

export const useProjectSprintQueries = () => {
  const getAllProjects = api.project.getAll.useQuery();

  const getProject = (id: number | undefined) =>
    api.project.getOne.useQuery({ id: Number(id) }, { enabled: Boolean(id) });

  const getSprint = (id: number | undefined) =>
    api.sprint.getOne.useQuery({ id: Number(id) }, { enabled: Boolean(id) });

  const getProjectSprints = (projectId: number | undefined) =>
    api.project.getSprints.useQuery(
      { projectId: Number(projectId) },
      { enabled: Boolean(projectId) }
    );

  const getProjectOptions = (
    projects: Array<{ id: number; name: string }> = []
  ) => {
    return projects.map((p) => ({
      value: p.id.toString(),
      label: p.name,
    }));
  };

  const getSprintOptions = (
    sprints: Array<{ id: number; reference: string }> = []
  ) => {
    return sprints.map((s) => ({
      value: s.id.toString(),
      label: s.reference,
    }));
  };

  return {
    getAllProjects,
    getProject,
    getSprint,
    getProjectSprints,
    getProjectOptions,
    getSprintOptions,
  };
};
