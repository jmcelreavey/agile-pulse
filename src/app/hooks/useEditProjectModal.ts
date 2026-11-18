import { useForm, schemaResolver } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { UpdateProjectUseCase } from "~/app/logic/project/UpdateProjectUseCase";
import {
  UpdateProjectSchema,
  type UpdateProjectInputType,
} from "~/server/api/schemas/project";
import { type GetOneProjectUseCaseType } from "~/server/logic/project/GetOneProjectUseCase";
import { api } from "~/trpc/react";

export const useEditProjectModal = (project: GetOneProjectUseCaseType) => {
  const [opened, { open, close }] = useDisclosure(false);

  // Determine initial config mode based on existing project configuration
  const initialConfigMode =
    project.jiraProjectKey && project.jiraProjectId ? "jira" : "custom";
  const [configMode, setConfigMode] = useState<"jira" | "custom">(
    initialConfigMode
  );

  const updateProject = new UpdateProjectUseCase();

  // Get Jira connection status and projects
  const jiraConnectionStatus = api.jira.getConnectionStatus.useQuery();
  const jiraProjects = api.jira.getProjects.useQuery(undefined, {
    enabled:
      !jiraConnectionStatus.isLoading &&
      jiraConnectionStatus.data?.isConnected === true &&
      !!jiraConnectionStatus.data?.cloudId,
  });

  const form = useForm<UpdateProjectInputType>({
    validateInputOnBlur: true,
    validate: schemaResolver(UpdateProjectSchema, { sync: true }),
  });

  // Check if Jira linking is available
  const canLinkToJira =
    jiraConnectionStatus.data?.isConnected &&
    !!jiraConnectionStatus.data?.cloudId;

  // Prepare Jira project options for the select
  const jiraProjectOptions =
    jiraProjects.data?.map((jiraProject) => ({
      value: `${jiraProject.key}|${jiraProject.id}`,
      label: `${jiraProject.name} (${jiraProject.key})`,
    })) ?? [];

  const onOpened = () => {
    form.setInitialValues({
      id: project.id,
      description: project.description,
      name: project.name,
      colour: project.colour,
      state: project.state,
      ticketUrlPrefix: project.ticketUrlPrefix,
      ticketUrlTemplate: project.ticketUrlTemplate,
      jiraProjectKey: project.jiraProjectKey,
      jiraProjectId: project.jiraProjectId,
    });
    form.reset();
    // Reset config mode based on current project state
    const currentConfigMode =
      project.jiraProjectKey && project.jiraProjectId ? "jira" : "custom";
    setConfigMode(currentConfigMode);
    open();
  };

  const onClosed = () => {
    close();
    updateProject.setIsMutating(false);
  };

  const handleSubmit = async (values: UpdateProjectInputType) => {
    await updateProject.execute({
      project: values,
      reference: values.name,
    });
    onClosed();
  };

  const handleJiraProjectChange = (value: string | null) => {
    if (value) {
      const [key, id] = value.split("|");
      form.setFieldValue("jiraProjectKey", key || "");
      form.setFieldValue("jiraProjectId", id || "");
    } else {
      form.setFieldValue("jiraProjectKey", "");
      form.setFieldValue("jiraProjectId", "");
    }
  };

  const handleConfigModeChange = (mode: "jira" | "custom") => {
    setConfigMode(mode);

    if (mode === "jira") {
      // Clear custom fields when switching to Jira mode
      form.setFieldValue("ticketUrlTemplate", "");
      form.setFieldValue("ticketUrlPrefix", "");
    } else {
      // Clear Jira fields when switching to custom mode
      form.setFieldValue("jiraProjectKey", "");
      form.setFieldValue("jiraProjectId", "");
    }
  };

  const selectedJiraProject =
    form.values.jiraProjectKey && form.values.jiraProjectId
      ? `${form.values.jiraProjectKey}|${form.values.jiraProjectId}`
      : "";

  const isLoading =
    updateProject.mutation.isPending || updateProject.isMutating;
  const isLinked = !!(project.jiraProjectKey && project.jiraProjectId);

  return {
    // State
    opened,
    isLoading,
    canLinkToJira,
    isLinked,
    configMode,

    // Data
    jiraProjectOptions,
    jiraProjectsLoading: jiraProjects.isLoading,
    selectedJiraProject,

    // Form
    form,

    // Actions
    onOpened,
    onClosed,
    handleSubmit,
    handleJiraProjectChange,
    handleConfigModeChange,

    // Use case for error handling
    updateProject,
  };
};
