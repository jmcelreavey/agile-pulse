"use client";

import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  type ButtonProps,
} from "@mantine/core";
import { useForm, schemaResolver } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import ErrorAlert from "~/app/components/base/alert/ErrorAlert";
import FormRichTextEditor from "~/app/components/base/rich-text-editor/FormRichTextEditor";
import { AsyncAutocomplete } from "~/app/components/base/select/AsyncAutoComplete";
import { useSprintTaskQueries } from "~/app/hooks/useSprintTaskQueries";
import { CreateSprintTaskUseCase } from "~/app/logic/sprint/CreateSprintTaskUseCase";
import {
  CreateSprintTaskSchema,
  type CreateSprintTaskInputType,
} from "~/server/api/schemas/sprint";
import { type GetOneSprintUseCaseType } from "~/server/logic/sprint/GetOneSprintUseCase";
import { State } from "~/shared/types/State";

export default function CreateSprintTaskModal({
  sprint,
  ...props
}: ButtonProps & {
  sprint: GetOneSprintUseCaseType;
}) {
  const [opened, { open, close }] = useDisclosure(false);

  const createSprintTask = new CreateSprintTaskUseCase();
  const { fetchTaskData, fetchMemberData } = useSprintTaskQueries({
    sprintId: sprint.id,
    projectId: sprint.projectId,
  });

  const form = useForm<CreateSprintTaskInputType>({
    validateInputOnBlur: true,
    initialValues: {
      sprintId: sprint.id,
      taskId: undefined,
      name: "",
      memberName: "",
      state: State.NOT_STARTED,
      days: 1,
      memberId: undefined,
      description: "",
    },
    validate: schemaResolver(CreateSprintTaskSchema, { sync: true }),
  });

  const onOpened = () => {
    form.reset();
    open();
  };

  return (
    <>
      <Button
        disabled={sprint.state === State.COMPLETED}
        onClick={onOpened}
        {...props}
      />

      <Modal
        opened={opened || createSprintTask.mutation.isPending}
        onClose={close}
        title={<Text fw={600}>Assign task</Text>}
        closeOnClickOutside={false}
        size="lg"
      >
        <form
          onSubmit={form.onSubmit((values) => {
            void (async () => {
              await createSprintTask.execute({
                sprintTask: values,
                reference: values.name,
              });

              close();
            })();
          })}
        >
          <Stack gap="sm">
            <AsyncAutocomplete
              fetchData={fetchTaskData}
              renderOption={(item) => <span>{item.name}</span>}
              getOptionValue={(item) => item.name}
              label="Assigned Task"
              placeholder="Search task..."
              onOptionSelect={(item) => {
                form.setFieldValue("name", item.name);
                form.setFieldValue("taskId", item.id);
                form.setFieldValue("state", item.state);
                form.setFieldValue("description", item.description);
              }}
              {...form.getInputProps("name")}
              onChange={(event) => {
                form.setFieldValue("name", event.currentTarget.value);
                form.setFieldValue("taskId", undefined);
              }}
            />
            <FormRichTextEditor
              value={form.values.description}
              onChange={(value) => form.setFieldValue("description", value)}
              onBlur={() => form.validateField("description")}
              error={form.errors.description}
              label="Task Description"
              disabled={createSprintTask.mutation.isPending}
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
              disabled={createSprintTask.mutation.isPending}
            />
            <NumberInput
              label="Days"
              required
              withAsterisk
              placeholder="Enter days"
              min={0}
              step={0.25}
              {...form.getInputProps("days")}
              disabled={createSprintTask.mutation.isPending}
            />
            <AsyncAutocomplete
              fetchData={fetchMemberData}
              renderOption={(item) => <span>{item.name}</span>}
              getOptionValue={(item) => item.name}
              label="Assigned Member"
              placeholder="Search member..."
              onOptionSelect={(item) => {
                form.setFieldValue("memberName", item.name);
                form.setFieldValue("memberId", item.id);
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

          <ErrorAlert mutation={createSprintTask.mutation} />

          <Group mt={16} justify="right" gap="xs">
            <Button
              variant="default"
              onClick={close}
              disabled={createSprintTask.mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.isValid() || createSprintTask.mutation.isPending}
              loading={createSprintTask.mutation.isPending}
            >
              Assign
            </Button>
          </Group>
        </form>
      </Modal>
    </>
  );
}
