import { useForm, schemaResolver } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { CreateProjectUseCase } from "~/app/logic/project/CreateProjectUseCase";
import { CreateProjectSchema } from "~/server/api/schemas/project";
import { type CreateProjectInput } from "~/server/logic/project/CreateProjectUseCase";
import { State } from "~/shared/types/State";
import { api } from "~/trpc/react";

export const useCreateProjectModal = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [configMode, setConfigMode] = useState<"jira" | "custom">("custom");

  const createProject = new CreateProjectUseCase();

  // Get Jira connection status and projects
  const jiraConnectionStatus = api.jira.getConnectionStatus.useQuery();
  const jiraProjects = api.jira.getProjects.useQuery(undefined, {
    enabled:
      !jiraConnectionStatus.isLoading &&
      jiraConnectionStatus.data?.isConnected === true &&
      !!jiraConnectionStatus.data?.cloudId,
  });

  const form = useForm<CreateProjectInput>({
    validateInputOnBlur: true,
    validate: schemaResolver(CreateProjectSchema, { sync: true }),
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
      name: "",
      description: "",
      state: State.NOT_STARTED,
      colour: undefined,
      ticketUrlTemplate: undefined,
      ticketUrlPrefix: undefined,
      jiraProjectKey: undefined,
      jiraProjectId: undefined,
    });
    form.reset();
    setConfigMode("custom");
    open();
  };

  const onClosed = () => {
    close();
    createProject.setIsMutating(false);
  };

  const handleSubmit = async (values: CreateProjectInput) => {
    await createProject.execute({
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
    createProject.mutation.isPending || createProject.isMutating;

  return {
    // State
    opened,
    isLoading,
    canLinkToJira,
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
    createProject,
  };
};
