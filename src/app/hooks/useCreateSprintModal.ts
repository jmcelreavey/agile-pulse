import { useForm, schemaResolver } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { CreateSprintUseCase } from "~/app/logic/sprint/CreateSprintUseCase";
import { CreateSprintSchema } from "~/server/api/schemas/sprint";
import { type GetOneProjectUseCaseType } from "~/server/logic/project/GetOneProjectUseCase";
import { type CreateSprintUseCaseInput } from "~/server/logic/sprint/CreateSprintUseCase";
import { State } from "~/shared/types/State";
import { api } from "~/trpc/react";

export const useCreateSprintModal = (project: GetOneProjectUseCaseType) => {
  const [opened, { open, close }] = useDisclosure(false);

  const createSprint = new CreateSprintUseCase();

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

  const form = useForm<CreateSprintUseCaseInput>({
    validateInputOnBlur: true,
    validate: schemaResolver(CreateSprintSchema, { sync: true }),
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
      reference: "1",
      days: 15,
      state: State.NOT_STARTED,
      projectId: project.id,
      jiraSprintId: undefined,
    });
    form.reset();
    open();
  };

  const onClosed = () => {
    close();
    createSprint.setIsMutating(false);
  };

  const handleSubmit = async (values: CreateSprintUseCaseInput) => {
    await createSprint.execute({
      sprint: values,
      reference: values.reference,
    });
    onClosed();
  };

  const isLoading = createSprint.mutation.isPending || createSprint.isMutating;

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
    createSprint,
  };
};
