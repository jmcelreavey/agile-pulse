import { z } from "zod";
import { protectedProcedure } from "~/server/api/procedures";
import {
  AssignMemberSchema,
  DeleteMemberSchema,
} from "~/server/api/schemas/member";
import {
  CompleteSprintSchema,
  CreateSprintSchema,
  CreateSprintTaskSchema,
  DeleteSprintMemberSchema,
  DeleteSprintTaskSchema,
  GetAllSprintsSchema,
  GetMembersSchema,
  GetNextSprintSchema,
  GetOneSprintSchema,
  GetPreviousSprintSchema,
  GetSprintDeadlinesSchema,
  GetStatsSchema,
  ManageSprintDeadlineSchema,
  MoveOverrunningTasksSchema,
  ProgressSprintSchema,
  ReopenSprintSchema,
  UnassignSprintDeadlineSchema,
  UnassignSprintTaskSchema,
  UpdateSprintMemberOrderSchema,
  UpdateSprintMemberSchema,
  UpdateSprintNotesSchema,
  UpdateSprintSchema,
  UpdateSprintTaskOrderSchema,
  UpdateSprintTaskSchema,
  UpstartSprintSchema,
} from "~/server/api/schemas/sprint";
import { createTRPCRouter } from "~/server/api/trpc";
import { CreateDeleteRecordUseCase } from "~/server/logic/common/CreateDeleteRecordUseCase";
import { CreateMemberUseCase } from "~/server/logic/member/CreateMemberUseCase";
import { AssignSprintMemberUseCase } from "~/server/logic/sprint/AssignSprintMemberUseCase";
import { CompleteSprintUseCase } from "~/server/logic/sprint/CompleteSprintUseCase";
import { CreateSprintTaskUseCase } from "~/server/logic/sprint/CreateSprintTaskUseCase";
import { CreateSprintUseCase } from "~/server/logic/sprint/CreateSprintUseCase";
import { DeleteSprintMemberUseCase } from "~/server/logic/sprint/DeleteSprintMemberUseCase";
import { DeleteSprintTaskUseCase } from "~/server/logic/sprint/DeleteSprintTaskUseCase";
import { DeleteSprintUseCase } from "~/server/logic/sprint/DeleteSprintUseCase";
import { GetAllSprintsUseCase } from "~/server/logic/sprint/GetAllSprintsUseCase";
import { GetNextSprintUseCase } from "~/server/logic/sprint/GetNextSprintUseCase";
import { GetOneSprintUseCase } from "~/server/logic/sprint/GetOneSprintUseCase";
import { GetOverrunningSprintTasksUseCase } from "~/server/logic/sprint/GetOverrunningSprintTasksUseCase";
import { GetPreviousSprintUseCase } from "~/server/logic/sprint/GetPreviousSprintUseCase";
import { GetSprintDeadlinesUseCase } from "~/server/logic/sprint/GetSprintDeadlinesUseCase";
import { GetSprintMemberMetricsUseCase } from "~/server/logic/sprint/GetSprintMemberMetricsUseCase";
import { GetSprintMembersUseCase } from "~/server/logic/sprint/GetSprintMembersUseCase";
import { GetSprintMetricsUseCase } from "~/server/logic/sprint/GetSprintMetricsUseCase";
import { GetSprintTasksUseCase } from "~/server/logic/sprint/GetSprintTasksUseCase";
import { ManageSprintDeadlineUseCase } from "~/server/logic/sprint/ManageSprintDeadlineUseCase";
import { MoveOverrunningSprintTasksUseCase } from "~/server/logic/sprint/MoveOverrunningSprintTasksUseCase";
import { ProgressSprintUseCase } from "~/server/logic/sprint/ProgressSprintUseCase";
import { ReopenSprintUseCase } from "~/server/logic/sprint/ReopenSprintUseCase";
import { UpstartSprintUseCase } from "~/server/logic/sprint/StartSprintUseCase";
import { UnassignSprintDeadlineUseCase } from "~/server/logic/sprint/UnassignSprintDeadlineUseCase";
import { UnassignSprintTaskUseCase } from "~/server/logic/sprint/UnassignSprintTaskUseCase";
import { UpdateSprintMemberOrderUseCase } from "~/server/logic/sprint/UpdateSprintMemberOrderUseCase";
import { UpdateSprintMemberUseCase } from "~/server/logic/sprint/UpdateSprintMemberUseCase";
import { UpdateSprintNotesUseCase } from "~/server/logic/sprint/UpdateSprintNotesUseCase";
import { UpdateSprintTaskOrderUseCase } from "~/server/logic/sprint/UpdateSprintTaskOrderUseCase";
import { UpdateSprintTaskUseCase } from "~/server/logic/sprint/UpdateSprintTaskUseCase";
import { UpdateSprintUseCase } from "~/server/logic/sprint/UpdateSprintUseCase";
import { CreateTaskUseCase } from "~/server/logic/task/CreateTaskUseCase";
import { UpdateTaskUseCase } from "~/server/logic/task/UpdateTaskUseCase";
import { DeleteSource } from "~/shared/types/DeleteSource";

export const sprintRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(GetAllSprintsSchema)
    .query(async ({ ctx, input }) => {
      const getAllSprints = new GetAllSprintsUseCase(ctx.db);
      const sprints = await getAllSprints.execute(input);
      return sprints;
    }),
  getOne: protectedProcedure
    .input(GetOneSprintSchema)
    .query(async ({ ctx, input }) => {
      const getOneSprint = new GetOneSprintUseCase(ctx.db);
      const sprint = await getOneSprint.execute(input);
      return sprint;
    }),
  getPrevious: protectedProcedure
    .input(GetPreviousSprintSchema)
    .query(async ({ ctx, input }) => {
      const getOneSprint = new GetPreviousSprintUseCase(ctx.db);
      const sprint = await getOneSprint.execute(input);
      return sprint;
    }),
  getNext: protectedProcedure
    .input(GetNextSprintSchema)
    .query(async ({ ctx, input }) => {
      const getOneSprint = new GetNextSprintUseCase(ctx.db);
      const sprint = await getOneSprint.execute(input);
      return sprint;
    }),
  create: protectedProcedure
    .input(CreateSprintSchema)
    .mutation(async ({ ctx, input }) => {
      const createSprint = new CreateSprintUseCase(ctx.db);
      const sprint = await createSprint.execute(input);
      return sprint;
    }),
  update: protectedProcedure
    .input(UpdateSprintSchema)
    .mutation(async ({ ctx, input }) => {
      const updateSprint = new UpdateSprintUseCase(ctx.db);
      const sprint = await updateSprint.execute(input);
      return sprint;
    }),
  updateMember: protectedProcedure
    .input(UpdateSprintMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const updateSprintMember = new UpdateSprintMemberUseCase(ctx.db);
      const member = await updateSprintMember.execute(input);
      return member;
    }),
  delete: protectedProcedure
    .input(DeleteMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const deleteSprint = new DeleteSprintUseCase(ctx.db);
      const deleteRecord = await new CreateDeleteRecordUseCase(ctx.db).execute({
        source: DeleteSource.SPRINT,
        sourceId: input.id,
      });

      const deletedRecord = await deleteSprint.execute({
        ...input,
        deletedRecordId: deleteRecord.id,
      });

      return deletedRecord;
    }),
  getTasks: protectedProcedure
    .input(
      z.object({
        sprintId: z.number(),
        zoomDay: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const getSprintTasks = new GetSprintTasksUseCase(ctx.db);
      return getSprintTasks.execute(input);
    }),
  getDeadlines: protectedProcedure
    .input(GetSprintDeadlinesSchema)
    .query(async ({ ctx, input }) => {
      const getSprintDeadlines = new GetSprintDeadlinesUseCase(ctx.db);
      const sprint = await getSprintDeadlines.execute(input);
      return sprint;
    }),
  getMembers: protectedProcedure
    .input(GetMembersSchema)
    .query(async ({ ctx, input }) => {
      const getSprintMembers = new GetSprintMembersUseCase(ctx.db);
      const members = await getSprintMembers.execute(input);
      return members;
    }),
  deleteMember: protectedProcedure
    .input(DeleteSprintMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const deleteMember = new DeleteSprintMemberUseCase(ctx.db);
      const deleteRecord = await new CreateDeleteRecordUseCase(ctx.db).execute({
        reason: input.reason,
        source: DeleteSource.SPRINT_MEMBER,
        sourceId: input.id,
      });

      const deletedRecord = await deleteMember.execute({
        ...input,
        deletedRecordId: deleteRecord.id,
      });

      return deletedRecord;
    }),
  deleteTask: protectedProcedure
    .input(DeleteSprintTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const deleteTask = new DeleteSprintTaskUseCase(ctx.db);
      const deleteRecord = await new CreateDeleteRecordUseCase(ctx.db).execute({
        reason: input.reason,
        source: DeleteSource.SPRINT_TASK,
        sourceId: input.id,
      });

      const deletedRecord = await deleteTask.execute({
        ...input,
        deletedRecordId: deleteRecord.id,
      });

      return deletedRecord;
    }),
  assignMember: protectedProcedure
    .input(AssignMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const assignMember = new AssignSprintMemberUseCase(ctx.db);
      const member = await assignMember.execute(input);
      return member;
    }),
  progress: protectedProcedure
    .input(ProgressSprintSchema)
    .mutation(async ({ ctx, input }) => {
      const progressSprint = new ProgressSprintUseCase(ctx.db);
      return await progressSprint.execute(input);
    }),
  complete: protectedProcedure
    .input(CompleteSprintSchema)
    .mutation(async ({ ctx, input }) => {
      const completeSprint = new CompleteSprintUseCase(ctx.db);
      return completeSprint.execute(input);
    }),
  upstart: protectedProcedure
    .input(UpstartSprintSchema)
    .mutation(async ({ ctx, input }) => {
      const upstartSprint = new UpstartSprintUseCase(ctx.db);
      return upstartSprint.execute(input);
    }),
  /**
   * We attempt to assign a task to a member. If the member doesn't exist, we create them.
   * This means a member ID or name has to be provided.
   * If the task doesn't exist, we create it.
   * This means a task ID or name has to be provided.
   * Currently we do not support multiple records of the same member in the same sprint.
   */
  createTask: protectedProcedure
    .input(CreateSprintTaskSchema)
    .mutation(async ({ ctx, input }) => {
      // Create the member if they doesn't exist
      let memberId = input.memberId;
      if (!memberId && input.memberName) {
        const member = new CreateMemberUseCase(ctx.db);
        const memberRecord = await member.execute({
          name: input.memberName,
        });
        memberId = memberRecord.id;
      }

      // Create the task if it doesn't exist
      let taskId = input.taskId;
      if (!taskId) {
        const createTask = new CreateTaskUseCase(ctx.db);
        const taskRecord = await createTask.execute({
          name: input.name,
          state: input.state,
          description: input.description,
        });
        taskId = taskRecord.id;
      } else {
        const updateTask = new UpdateTaskUseCase(ctx.db);
        await updateTask.execute({
          id: taskId,
          name: input.name,
          state: input.state,
          description: input.description,
        });
      }

      // update the task with the new name

      if (!memberId || !taskId) {
        throw new Error(
          "Member and Task are required and couldn't be created."
        );
      }

      // Add member to the sprint (if not already added or requested to add as new member)
      const assignToSprint = new AssignSprintMemberUseCase(ctx.db);
      const sprintMember = await assignToSprint.execute({
        memberId,
        sprintId: input.sprintId,
      });

      // Assign the task to the member
      const assignMember = new CreateSprintTaskUseCase(ctx.db);
      const memberTask = await assignMember.execute({
        taskId,
        sprintMemberId: sprintMember.id,
        sprintId: input.sprintId,
        days: input.days,
        order: input.order,
      });

      return memberTask;
    }),
  unassignTask: protectedProcedure
    .input(UnassignSprintTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const unassignTask = new UnassignSprintTaskUseCase(ctx.db);
      const task = await unassignTask.execute(input);
      return task;
    }),
  updateTask: protectedProcedure
    .input(UpdateSprintTaskSchema)
    .mutation(async ({ ctx, input }) => {
      // Create the member if they doesn't exist
      let memberId = input.memberId;
      if (!memberId && input.memberName) {
        const member = new CreateMemberUseCase(ctx.db);
        const memberRecord = await member.execute({
          name: input.memberName,
        });
        memberId = memberRecord.id;
      }

      let sprintMember;
      if (memberId) {
        // Add member to the sprint (if not already added or requested to add as new member)
        const assignToSprint = new AssignSprintMemberUseCase(ctx.db);
        sprintMember = await assignToSprint.execute({
          memberId,
          sprintId: input.sprintId,
        });
      }

      // Assign the task to the member
      const updateTask = new UpdateSprintTaskUseCase(ctx.db);
      const task = await updateTask.execute({
        id: input.id,
        sprintMemberId: sprintMember?.id ?? null,
        sprintId: input.sprintId,
        days: input.days,
        state: input.state,
        name: input.name,
        description: input.description,
      });

      return task;
    }),
  updateSprintTaskOrder: protectedProcedure
    .input(UpdateSprintTaskOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const updateTaskOrder = new UpdateSprintTaskOrderUseCase(ctx.db);
      const task = await updateTaskOrder.execute({
        sprintId: input.sprintId,
        sprintTaskId: input.sprintTaskId,
        order: input.order,
        sprintMemberId: input.sprintMemberId,
      });

      return task;
    }),
  updateSprintMemberOrder: protectedProcedure
    .input(UpdateSprintMemberOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const updateOrder = new UpdateSprintMemberOrderUseCase(ctx.db);
      const task = await updateOrder.execute({
        sprintId: input.sprintId,
        sprintMemberId: input.sprintMemberId,
        order: input.order,
      });

      return task;
    }),
  updateNotes: protectedProcedure
    .input(UpdateSprintNotesSchema)
    .mutation(async ({ ctx, input }) => {
      const updateNotes = new UpdateSprintNotesUseCase(ctx.db);
      const sprint = await updateNotes.execute({
        id: input.id,
        notes: input.notes,
      });
      return sprint;
    }),
  manageDeadlines: protectedProcedure
    .input(ManageSprintDeadlineSchema)
    .mutation(async ({ ctx, input }) => {
      const manageDeadlines = new ManageSprintDeadlineUseCase(ctx.db);
      const sprint = await manageDeadlines.execute(input);
      return sprint;
    }),
  unassignDeadline: protectedProcedure
    .input(UnassignSprintDeadlineSchema)
    .mutation(async ({ ctx, input }) => {
      const unassignTask = new UnassignSprintDeadlineUseCase(ctx.db);
      const task = await unassignTask.execute(input);
      return task;
    }),
  getMemberMetrics: protectedProcedure
    .input(GetStatsSchema)
    .query(async ({ ctx, input }) => {
      const getMemberMetrics = new GetSprintMemberMetricsUseCase(ctx.db);
      const memberMetrics = await getMemberMetrics.execute(input);
      return memberMetrics;
    }),
  getMetrics: protectedProcedure
    .input(GetStatsSchema)
    .query(async ({ ctx, input }) => {
      const getMetrics = new GetSprintMetricsUseCase(ctx.db);
      const metrics = await getMetrics.execute(input);
      return metrics;
    }),

  moveOverrunningTasks: protectedProcedure
    .input(MoveOverrunningTasksSchema)
    .mutation(async ({ ctx, input }) => {
      const moveOverrunningTasks = new MoveOverrunningSprintTasksUseCase(
        ctx.db
      );
      const tasks = await moveOverrunningTasks.execute(input);
      return tasks;
    }),
  reopen: protectedProcedure
    .input(ReopenSprintSchema)
    .mutation(async ({ ctx, input }) => {
      const reopenSprint = new ReopenSprintUseCase(ctx.db);
      const sprint = await reopenSprint.execute(input);
      return sprint;
    }),
  getOverrunningTasks: protectedProcedure
    .input(z.object({ sprintId: z.number().positive() }))
    .query(async ({ ctx, input }) => {
      const getOverrunningTasks = new GetOverrunningSprintTasksUseCase(ctx.db);
      const overrunningTasks = await getOverrunningTasks.execute({
        sprintId: input.sprintId,
      });
      return overrunningTasks;
    }),
});
