"use client";

import { Alert, Badge, Button, Group, NumberInput, Select, Stack, Table, Text, Textarea } from "@mantine/core";
import { IconLayoutBoardSplit, IconWand } from "@tabler/icons-react";
import { useState } from "react";
import { Hint, Row, SourceBadge } from "~/app/components/insights/shared";
import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { InvalidateSprintDataUseCase } from "~/app/logic/sprint/InvalidateSprintDataUseCase";
import { type PlannedTask } from "~/shared/logic/insights/planner";
import { api } from "~/trpc/react";

const EXAMPLE = `- Saved cards (2d)
- Apple Pay (M)
- Gift cards | 3
- Order history @ben
- Checkout copy review
- Address book 4 days`;

export const PlannerPanel = ({ sprintId, disabled }: { sprintId: number; disabled?: boolean }) => {
  const [backlog, setBacklog] = useState("");
  const [rows, setRows] = useState<PlannedTask[]>([]);
  const [applying, setApplying] = useState(false);
  const preview = api.insights.planPreview.useMutation({
    onSuccess: (data) => setRows(data.plan.tasks),
    onError: (error) => ShowNotificationUtil({ message: error.message, isError: true }),
  });
  const createTask = api.sprint.createTask.useMutation();
  const invalidate = new InvalidateSprintDataUseCase();
  const plan = preview.data?.plan;
  const members = preview.data?.members ?? [];

  const apply = async () => {
    setApplying(true);
    try {
      for (const row of rows) {
        const member = members.find((m) => m.name === row.member);
        if (!member) continue;
        await createTask.mutateAsync({
          sprintId,
          name: row.name,
          days: row.days,
          ...(member.memberId ? { memberId: member.memberId } : { memberName: member.name }),
        });
      }
      ShowNotificationUtil({ title: "Plan added", message: `${rows.length} tasks are on the chart. Drag them to adjust.`, autoClose: 4000 });
      setRows([]);
      preview.reset();
      setBacklog("");
      await invalidate.execute();
    } catch (error) {
      ShowNotificationUtil({ message: error instanceof Error ? error.message : "Could not add the plan", isError: true });
    } finally {
      setApplying(false);
    }
  };

  return (
    <Stack gap="lg">
      <Textarea
        label="Backlog"
        description="One item per line. Estimates like 2d, (1.5), | 3 or (S/M/L) are optional; @name asks for a person."
        placeholder={EXAMPLE}
        autosize
        minRows={5}
        maxRows={14}
        value={backlog}
        onChange={(event) => setBacklog(event.currentTarget.value)}
      />
      <Group gap="xs">
        <Button
          leftSection={<IconWand size={16} />}
          disabled={disabled || backlog.trim().length < 3}
          loading={preview.isPending}
          onClick={() => preview.mutate({ sprintId, backlog })}
        >
          Plan it
        </Button>
        <Button variant="subtle" onClick={() => setBacklog(EXAMPLE)} disabled={disabled}>
          Use an example
        </Button>
      </Group>

      {plan && (
        <Stack gap="md">
          <Row>
            <Text fw={600}>{plan.summary}</Text>
            {preview.data && <SourceBadge source={preview.data.source} />}
          </Row>
          <Table.ScrollContainer minWidth={480}>
            <Table withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Member</Table.Th>
                  <Table.Th>Capacity</Table.Th>
                  <Table.Th>Planned</Table.Th>
                  <Table.Th>Free</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {plan.lanes.map((lane) => {
                  const member = members.find((m) => m.name === lane.member);
                  return (
                    <Table.Tr key={lane.member}>
                      <Table.Td>{lane.member}</Table.Td>
                      <Table.Td>
                        {lane.capacity}d{" "}
                        <Text span size="xs" c="dimmed">
                          ({member?.timeOffDays ? `${member.timeOffDays}d leave, ` : ""}focus {Math.round((member?.focusFactor ?? 1) * 100)}%)
                        </Text>
                      </Table.Td>
                      <Table.Td>{lane.planned}d</Table.Td>
                      <Table.Td>
                        <Text c={lane.free < 0 ? "red" : undefined} size="sm">
                          {lane.free}d
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          <Table.ScrollContainer minWidth={640}>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Task</Table.Th>
                  <Table.Th w={110}>Days</Table.Th>
                  <Table.Th w={190}>Member</Table.Th>
                  <Table.Th>Why</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row, index) => (
                  <Table.Tr key={`${row.name}-${index}`}>
                    <Table.Td>
                      {row.name}{" "}
                      {row.estimated && (
                        <Badge size="xs" variant="outline">
                          estimated
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        aria-label={`Days for ${row.name}`}
                        size="xs"
                        min={0.25}
                        max={24}
                        step={0.25}
                        value={row.days}
                        onChange={(value) => setRows(rows.map((r, i) => (i === index ? { ...r, days: Number(value) || r.days } : r)))}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Select
                        aria-label={`Member for ${row.name}`}
                        size="xs"
                        data={members.map((m) => m.name)}
                        value={row.member}
                        onChange={(value) => setRows(rows.map((r, i) => (i === index ? { ...r, member: value, reason: "Chosen by you" } : r)))}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {row.reason}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          {plan.overflow.length > 0 && (
            <Alert color="orange" variant="light" title="Doesn't fit">
              {plan.overflow.map((task) => `${task.name} (${task.days}d)`).join(", ")}. Add them to a later sprint or make room first.
            </Alert>
          )}
          <Group>
            <Button leftSection={<IconLayoutBoardSplit size={16} />} onClick={() => void apply()} loading={applying} disabled={!rows.length || disabled}>
              Add {rows.length} tasks to the chart
            </Button>
          </Group>
        </Stack>
      )}
      <Hint>
        Capacity is sprint days minus leave, scaled by each person&apos;s focus factor (work done over work planned in the last three
        completed sprints). The biggest items go first, each to whoever has the most room. With an OpenAI key set, items without an
        estimate get one from the model; the allocation itself is always the rule above.
      </Hint>
    </Stack>
  );
};
