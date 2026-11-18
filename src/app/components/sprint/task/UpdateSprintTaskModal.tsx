"use client";

import {
  Button,
  CloseButton,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  type ModalProps,
} from "@mantine/core";
import { useForm, schemaResolver } from "@mantine/form";
import { useEffect } from "react";
import ErrorAlert from "~/app/components/base/alert/ErrorAlert";
import FormRichTextEditor from "~/app/components/base/rich-text-editor/FormRichTextEditor";
import { AsyncAutocomplete } from "~/app/components/base/select/AsyncAutoComplete";
import { DeleteSprintTaskButton } from "~/app/components/sprint/task/DeleteSprintTaskButton";
import { useSprintTaskQueries } from "~/app/hooks/useSprintTaskQueries";
import { UnassignSprintTaskUseCase } from "~/app/logic/sprint/UnassignSprintTaskUseCase";
import { UpdateSprintTaskUseCase } from "~/app/logic/sprint/UpdateSprintTaskUseCase";
import {
  UpdateSprintTaskSchema,
  type UpdateSprintTaskInputType,
} from "~/server/api/schemas/sprint";
import { type GetOneSprintUseCaseType } from "~/server/logic/sprint/GetOneSprintUseCase";
import { type GetSprintTasksUseCaseType } from "~/server/logic/sprint/GetSprintTasksUseCase";
import { State } from "~/shared/types/State";

export default function UpdateSprintTaskModal({
  sprintTask,
  sprint,
  opened,
  onClose,
  ...props
}: ModalProps & {
  sprintTask: GetSprintTasksUseCaseType[0];
  sprint: GetOneSprintUseCaseType;
}) {
  const updateSprintTask = new UpdateSprintTaskUseCase();
  const unassignSprintTask = new UnassignSprintTaskUseCase();
  const { fetchMemberData, fetchSprintData } = useSprintTaskQueries({
    sprintId: sprint.id,
    projectId: sprint.projectId,
  });

  const form = useForm<UpdateSprintTaskInputType>({
    validateInputOnBlur: true,
    initialValues: {
      id: sprintTask.id,
      sprintId: sprintTask.sprintId,
      reference: sprintTask.sprintReference,
      memberName: sprintTask.memberName,
      state: sprintTask.state,
      days: sprintTask.days,
      memberId: sprintTask.memberId,
      name: sprintTask.name,
      description: sprintTask.description,
    },
    validate: schemaResolver(UpdateSprintTaskSchema, { sync: true }),
  });

  useEffect(() => {
    form.setInitialValues({
      id: sprintTask.id,
      sprintId: sprintTask.sprintId,
      reference: sprintTask.sprintReference,
      memberName: sprintTask.memberName,
      state: sprintTask.state,
      days: sprintTask.days,
      memberId: sprintTask.memberId,
      name: sprintTask.name,
      description: sprintTask.description,
    });

    form.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprintTask, form.setInitialValues, form.reset]);

  const handleClose = () => {
    onClose();
    updateSprintTask.setIsMutating(false);
  };

  return (
    <Modal
      {...props}
      onClose={handleClose}
      opened={opened || updateSprintTask.mutation.isPending}
      title={<Text fw={600}>Assign task</Text>}
      closeOnClickOutside={true}
      size="lg"
    >
      <form
        onSubmit={form.onSubmit((values) => {
          void (async () => {
            await updateSprintTask.execute({
              sprintTask: values,
              reference: sprintTask.name,
            });

            handleClose();
          })();
        })}
      >
        <Stack gap="sm">
          <AsyncAutocomplete
            fetchData={fetchSprintData}
            initialValue={sprintTask.sprintReference}
            renderOption={(item) => <span>{item.reference}</span>}
            getOptionValue={(item) => item.reference}
            label="Assigned Sprint"
            placeholder="Search sprints..."
            withAsterisk
            onOptionSelect={(item) => {
              const currentValues = form.getValues();
              void form.setValues({
                ...currentValues,
                sprintId: item.id,
                reference: item.reference,
              });
            }}
            {...form.getInputProps("reference")}
            onChange={(event) => {
              const reference = event.currentTarget.value;
              const currentValues = form.getValues();
              void form.setValues({
                ...currentValues,
                sprintId: undefined,
                reference,
              });
            }}
          />
          <TextInput
            {...form.getInputProps("name")}
            label="Task Name"
            required
            withAsterisk
          />
          <FormRichTextEditor
            value={form.values.description}
            onChange={(value) => form.setFieldValue("description", value)}
            onBlur={() => form.validateField("description")}
            error={form.errors.description}
            label="Task Description"
            disabled={updateSprintTask.mutation.isPending}
          />
          <Select
            label="State"
            placeholder="Select task state"
            required
            withAsterisk
            {...form.getInputProps("state")}
            data={Object.values(State).map((state) => ({
              value: state,
              label: state,
            }))}
            disabled={updateSprintTask.mutation.isPending}
          />
          <NumberInput
            label="Days"
            placeholder="Enter days"
            min={0}
            step={0.25}
            {...form.getInputProps("days")}
            disabled={updateSprintTask.mutation.isPending}
          />
          <AsyncAutocomplete
            rightSection={
              <CloseButton
                disabled={unassignSprintTask.isMutating}
                onClick={async () => {
                  await unassignSprintTask.execute({
                    sprintTask: { sprintTaskId: sprintTask.id },
                    reference: sprintTask.name,
                  });

                  handleClose();
                }}
              />
            }
            initialValue={sprintTask.memberName}
            fetchData={fetchMemberData}
            renderOption={(item) => <span>{item.name}</span>}
            getOptionValue={(item) => item.name}
            label="Assigned Member"
            placeholder="Search member..."
            onOptionSelect={(item) => {
              const currentValues = form.getValues();
              void form.setValues({
                ...currentValues,
                memberName: item.name,
                memberId: item.id,
              });
            }}
            {...form.getInputProps("memberName")}
            onChange={(event) => {
              const memberName = event.currentTarget.value;
              const currentValues = form.getValues();
              void form.setValues({
                ...currentValues,
                memberName,
                memberId: undefined,
              });
            }}
          />
        </Stack>

        <ErrorAlert mutation={updateSprintTask.mutation} />

        <Group mt={16} justify="space-between">
          <DeleteSprintTaskButton
            size="sm"
            task={sprintTask}
            onDeleted={async () => handleClose()}
            variant="filled"
            color="red.8"
          />
          <Group justify="right" gap="xs">
            <Button
              variant="default"
              onClick={handleClose}
              disabled={updateSprintTask.mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.isValid() || updateSprintTask.mutation.isPending}
              loading={updateSprintTask.mutation.isPending}
            >
              Update
            </Button>
          </Group>
        </Group>
      </form>
    </Modal>
  );
}
