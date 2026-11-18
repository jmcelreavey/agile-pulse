import { z } from "zod";
import { protectedProcedure } from "~/server/api/procedures";
import {
    UpdateProjectSharedNotesSchema,
  CompleteProjectSchema,
  CreateProjectSchema,
  DeleteProjectSchema,
  GetOneProjectSchema,
  ReopenProjectSchema,
  StartProjectSchema,
  UpdateProjectNotesSchema,
  UpdateProjectSchema,
} from "~/server/api/schemas/project";
import { createTRPCRouter } from "~/server/api/trpc";
import { CreateDeleteRecordUseCase } from "~/server/logic/common/CreateDeleteRecordUseCase";
import { CompleteProjectUseCase } from "~/server/logic/project/CompleteProjectUseCase";
import { CreateProjectUseCase } from "~/server/logic/project/CreateProjectUseCase";
import { DeleteProjectUseCase } from "~/server/logic/project/DeleteProjectUseCase";
import { GetAllProjectsUseCase } from "~/server/logic/project/GetAllProjectsUseCase";
import { GetOneProjectUseCase } from "~/server/logic/project/GetOneProjectUseCase";
import { GetProjectCustomersUseCase } from "~/server/logic/project/GetProjectCustomersUseCase";
import { GetProjectSprintsUseCase } from "~/server/logic/project/GetProjectSprintsUseCase";
import { ReopenProjectUseCase } from "~/server/logic/project/ReopenProjectUseCase";
import { StartProjectUseCase } from "~/server/logic/project/StartProjectUseCase";
import { UpdateProjectNotesUseCase } from "~/server/logic/project/UpdateProjectNotesUseCase";
import { UpdateProjectSharedNotesUseCase } from "~/server/logic/project/UpdateProjectSharedNotesUseCase";
import { UpdateProjectUseCase } from "~/server/logic/project/UpdateProjectUseCase";
import { DeleteSource } from "~/shared/types/DeleteSource";

export const projectRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const getAllProjects = new GetAllProjectsUseCase(ctx.db);
    const projects = await getAllProjects.execute({
      domain: ctx.session?.user.domain,
    });
    return projects;
  }),
  getOne: protectedProcedure
    .input(GetOneProjectSchema)
    .query(async ({ ctx, input }) => {
      const getOneProject = new GetOneProjectUseCase(ctx.db);
      const project = await getOneProject.execute(input);
      return project;
    }),
  create: protectedProcedure
    .input(CreateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const createProject = new CreateProjectUseCase(ctx.db);
      const project = await createProject.execute({
        ...input,
        domain: ctx.session?.user.domain,
      });
      return project;
    }),
  update: protectedProcedure
    .input(UpdateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const updateProject = new UpdateProjectUseCase(ctx.db);
      const project = await updateProject.execute(input);
      return project;
    }),
  delete: protectedProcedure
    .input(DeleteProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const deleteProject = new DeleteProjectUseCase(ctx.db);
      const deleteRecord = await new CreateDeleteRecordUseCase(ctx.db).execute({
        reason: input.reason,
        source: DeleteSource.PROJECT,
        sourceId: input.id,
      });

      const deletedRecord = await deleteProject.execute({
        ...input,
        deletedRecordId: deleteRecord.id,
      });

      return deletedRecord;
    }),
  getSprints: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const getProjectSprints = new GetProjectSprintsUseCase(ctx.db);
      const sprints = await getProjectSprints.execute(input);
      return sprints;
    }),
  complete: protectedProcedure
    .input(CompleteProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const completeProject = new CompleteProjectUseCase(ctx.db);
      await completeProject.execute(input);
      return true;
    }),
  start: protectedProcedure
    .input(StartProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const startProject = new StartProjectUseCase(ctx.db);
      await startProject.execute(input);
      return true;
    }),
  updateNotes: protectedProcedure
    .input(UpdateProjectNotesSchema)
    .mutation(async ({ ctx, input }) => {
      const updateNotes = new UpdateProjectNotesUseCase(ctx.db);
      const project = await updateNotes.execute({
        id: input.id,
        notes: input.notes,
      });
      return project;
    }),
  updateSharedNotes: protectedProcedure
    .input(UpdateProjectSharedNotesSchema)
    .mutation(async ({ ctx, input }) => {
      const updateSharedNotes = new UpdateProjectSharedNotesUseCase(ctx.db);
      const project = await updateSharedNotes.execute({
        id: input.id,
        sharedNotes: input.sharedNotes,
      });
      return project;
    }),
  reopen: protectedProcedure
    .input(ReopenProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const reopenProject = new ReopenProjectUseCase(ctx.db);
      const project = await reopenProject.execute(input);
      return project;
    }),
  getCustomers: protectedProcedure
    .input(z.object({ projectId: z.number().positive() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("User not authenticated");
      }

      const getProjectCustomers = new GetProjectCustomersUseCase(
        ctx.db,
        ctx.session.user
      );
      const customers = await getProjectCustomers.execute({
        projectId: input.projectId,
      });

      return customers;
    }),
});
