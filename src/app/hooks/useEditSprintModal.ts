import { useForm, schemaResolver } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { UpdateSprintUseCase } from "~/app/logic/sprint/UpdateSprintUseCase";
import { UpdateSprintSchema } from "~/server/api/schemas/sprint";
import { type GetOneProjectUseCaseType } from "~/server/logic/project/GetOneProjectUseCase";
import { type GetOneSprintUseCaseType } from "~/server/logic/sprint/GetOneSprintUseCase";
import { type UpdateSprintUseCaseInput } from "~/server/logic/sprint/UpdateSprintUseCase";
import { api } from "~/trpc/react";

export const useEditSprintModal = (
  sprint: GetOneSprintUseCaseType,
  project: GetOneProjectUseCaseType
) => {
  const [opened, { open, close }] = useDisclosure(false);

  const updateSprint = new UpdateSprintUseCase();

  // Get Jira connection status and sprints
  const jiraConnectionStatus = api.jira.getConnectionStatus.useQuery();
  const jiraSprints = api.jira.getSprints.useQuery(
    {
      projectKey: project.jiraProjectKey || "",
      cloudId: jiraConnectionStatus.data?.cloudId || "",
    },
    {
      enabled:
        !!project.jiraProjectKey &&
        !!jiraConnectionStatus.data?.cloudId &&
        jiraConnectionStatus.data?.isConnected,
    }
  );

  const form = useForm<UpdateSprintUseCaseInput>({
    validateInputOnBlur: true,
    validate: schemaResolver(UpdateSprintSchema, { sync: true }),
  });

  // Check if Jira linking is available
  const canLinkToJira =
    jiraConnectionStatus.data?.isConnected &&
    project.jiraProjectKey &&
    jiraConnectionStatus.data?.cloudId;

  // Prepare Jira sprint options for the select
  const jiraSprintOptions =
    jiraSprints.data?.map((jiraSprint) => ({
      value: jiraSprint.id.toString(),
      label: `${jiraSprint.name} (${jiraSprint.state})`,
    })) ?? [];

  const onOpened = () => {
    form.setInitialValues({
      reference: sprint.reference,
      days: sprint.days,
      daysRemaining: sprint.daysRemaining,
      id: sprint.id,
      jiraSprintId: sprint.jiraSprintId ?? undefined,
    });
    form.reset();
    open();
  };

  const onClosed = () => {
    close();
    updateSprint.setIsMutating(false);
  };

  const handleSubmit = async (values: UpdateSprintUseCaseInput) => {
    await updateSprint.execute({
      sprint: values,
      reference: values.reference,
    });
    onClosed();
  };

  const isLoading = updateSprint.mutation.isPending || updateSprint.isMutating;

  return {
    // State
    opened,
    isLoading,
    canLinkToJira,

    // Data
    jiraSprintOptions,
    jiraSprintsLoading: jiraSprints.isLoading,

    // Form
    form,

    // Actions
    onOpened,
    onClosed,
    handleSubmit,

    // Use case for error handling
    updateSprint,
  };
};
