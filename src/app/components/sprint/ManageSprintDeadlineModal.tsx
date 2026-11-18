"use client";

import {
  Button,
  ColorInput,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Textarea,
  type ModalProps,
} from "@mantine/core";
import { useForm, schemaResolver } from "@mantine/form";
import { useEffect } from "react";
import ErrorAlert from "~/app/components/base/alert/ErrorAlert";
import { AsyncAutocomplete } from "~/app/components/base/select/AsyncAutoComplete";
import { useDeliveryChartContext } from "~/app/components/sprint/chart/DeliveryChartContext";
import { useSprintDeadlineQueries } from "~/app/hooks/useSprintDeadlineQueries";
import { ManageSprintDeadlineUseCase } from "~/app/logic/sprint/ManageSprintDeadlineUseCase";
import { UnassignSprintDeadlineUseCase } from "~/app/logic/sprint/UnassignSprintDeadlineUseCase";
import {
  ManageSprintDeadlineSchema,
  type ManageSprintDeadlineInputType,
} from "~/server/api/schemas/sprint";
import { type GetSprintDeadlinesUseCaseType } from "~/server/logic/sprint/GetSprintDeadlinesUseCase";

export default function ManageSprintDeadlineModal({
  deadline,
  day,
  opened,
  onClose,
  ...props
}: ModalProps & {
  deadline?: GetSprintDeadlinesUseCaseType[0];
  day: number;
}) {
  const { sprint } = useDeliveryChartContext();
  const unassignSprintDeadline = new UnassignSprintDeadlineUseCase();
  const { fetchDeadlineData } = useSprintDeadlineQueries({
    sprintId: sprint.id,
    projectId: sprint.projectId,
  });
  const manageSprintDeadline = new ManageSprintDeadlineUseCase();

  const form = useForm<ManageSprintDeadlineInputType>({
    validateInputOnBlur: true,
    initialValues: {
      deadlineId: deadline?.deadlineId,
      sprintId: sprint.id,
      day: day,
      name: "",
      description: "",
      colour: "",
    },
    validate: schemaResolver(ManageSprintDeadlineSchema, { sync: true }),
  });

  useEffect(() => {
    form.setInitialValues({
      deadlineId: deadline?.deadlineId,
      sprintId: sprint.id,
      day: day,
      name: deadline?.name ?? "",
      description: deadline?.description ?? "",
      colour: deadline?.colour ?? "",
    });
    form.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline, sprint, day, form.setInitialValues, form.reset]);

  const handleClose = () => {
    onClose();
    manageSprintDeadline.setIsMutating(false);
  };

  return (
    <Modal
      {...props}
      onClose={handleClose}
      opened={opened || manageSprintDeadline.mutation.isPending}
      title={<Text fw={600}>Manage Sprint Deadline For Day Ending</Text>}
      closeOnClickOutside={true}
    >
      <form
        onSubmit={form.onSubmit((values) => {
          void (async () => {
            await manageSprintDeadline.execute({
              sprintDeadline: values,
            });
            handleClose();
          })();
        })}
      >
        <Stack gap="sm">
          <TextInput label="Day" {...form.getInputProps("day")} disabled />
          <AsyncAutocomplete
            fetchData={fetchDeadlineData}
            renderOption={(item) => <span>{item.name}</span>}
            getOptionValue={(item) => item.name}
            label="Assigned Deadline"
            placeholder="Search deadlines..."
            onOptionSelect={(item) => {
              form.setFieldValue("name", item.name);
              form.setFieldValue("colour", item.colour);
              form.setFieldValue("description", item.description);
              form.setFieldValue("deadlineId", item.id ?? undefined);
            }}
            {...form.getInputProps("name")}
            onChange={(event) => {
              form.setFieldValue("name", event.currentTarget.value);
              form.setFieldValue("deadlineId", undefined);
            }}
          />
          <Textarea
            {...form.getInputProps("description")}
            label="Description"
            placeholder="Enter deadline description"
          />
          <ColorInput
            label="Colour"
            placeholder="Select a colour"
            {...form.getInputProps("colour")}
            required
            withAsterisk
          />
          {deadline && (
            <Button
              variant="light"
              disabled={unassignSprintDeadline.isMutating}
              loading={unassignSprintDeadline.isMutating}
              onClick={async () => {
                await unassignSprintDeadline.execute({
                  sprintDeadline: { sprintDeadlineId: deadline.id },
                  reference: deadline.name,
                });

                handleClose();
              }}
            >
              Remove Deadline
            </Button>
          )}
        </Stack>

        <ErrorAlert mutation={manageSprintDeadline.mutation} />

        <Group mt={16} justify="right" gap="xs">
          <Button
            variant="default"
            onClick={handleClose}
            disabled={manageSprintDeadline.mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              !form.isValid() || manageSprintDeadline.mutation.isPending
            }
            loading={manageSprintDeadline.mutation.isPending}
          >
            {deadline ? "Update" : "Add"}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
