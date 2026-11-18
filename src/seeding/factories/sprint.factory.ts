import { SeedingFactory } from "~/seeding/factories/factory";
import { memberFactory } from "~/seeding/factories/member.factory";
import { projectFactory } from "~/seeding/factories/project.factory";
import { type AssignMemberInputType } from "~/server/api/schemas/member";
import {
  type CompleteSprintInputType,
  type CreateSprintInputType,
  type CreateSprintTaskInputType,
  type DeleteSprintInputType,
  type ManageSprintDeadlineInputType,
  type ProgressSprintInputType,
  type UpdateSprintInputType,
  type UpdateSprintNotesInputType,
  type UpstartSprintInputType,
} from "~/server/api/schemas/sprint";
import { State } from "~/shared/types/State";

export type AssignSprintTaskRecipe = Partial<CreateSprintTaskInputType>;
export type SprintCreateRecipe = Partial<CreateSprintInputType>;
export type SprintUpdateRecipe = Partial<UpdateSprintInputType>;
export type SprintRemoveRecipe = Partial<DeleteSprintInputType>;
export type SprintAssignMemberRecipe = Partial<AssignMemberInputType>;
export type StartSprintRecipe = Partial<UpstartSprintInputType>;
export type CompleteSprintRecipe = Partial<CompleteSprintInputType>;
export type ProgressSprintRecipe = Partial<ProgressSprintInputType>;
export type UpdateSprintNotesRecipe = Partial<UpdateSprintNotesInputType>;
export type ManageSprintDeadlinRecipe = Partial<ManageSprintDeadlineInputType>;

export const sprintFactory = {
  createSprint: SeedingFactory.make(
    async ({ faker, api }, recipe?: SprintCreateRecipe) => {
      const days = recipe?.days ?? faker.number.int({ min: 1, max: 30 });
      const sprintRecipe = {
        reference:
          recipe?.reference ??
          faker.number.int({ min: 1, max: 100 }).toString(),
        days,
        daysRemaining:
          recipe?.daysRemaining ?? faker.number.int({ min: 0, max: days }),
        state: recipe?.state ?? faker.helpers.enumValue(State),
        projectId:
          recipe?.projectId ?? (await projectFactory.createProject()).id,
      };

      const sprint = await api.sprint.create(sprintRecipe);

      return sprint;
    }
  ),

  updateSprint: SeedingFactory.make(
    async ({ faker, api }, recipe?: SprintUpdateRecipe) => {
      if (!recipe?.id) {
        throw new Error("Sprint ID is required for updating a sprint.");
      }

      const sprintRecipe = {
        id: recipe.id,
        reference:
          recipe?.reference ??
          faker.number.int({ min: 1, max: 100 }).toString(),
        days: recipe?.days ?? faker.number.int({ min: 1, max: 30 }),
      };

      const sprint = await api.sprint.update(sprintRecipe);

      return sprint;
    }
  ),

  delete: SeedingFactory.make(
    async ({ faker, api }, recipe?: SprintRemoveRecipe) => {
      if (!recipe?.id) {
        throw new Error("Sprint ID is required for removing a sprint.");
      }

      const deleteRecipe = {
        id: recipe.id,
        reason: recipe.reason ?? faker.music.songName(),
      };

      const sprint = await api.sprint.delete(deleteRecipe);

      return sprint;
    }
  ),

  assignMember: SeedingFactory.make(
    async ({ api }, recipe?: SprintAssignMemberRecipe) => {
      const sprintMemberRecipe = {
        sprintId: recipe?.sprintId ?? (await sprintFactory.createSprint()).id,
        memberId: recipe?.memberId ?? (await memberFactory.createMember()).id,
      };

      const sprintMember = await api.sprint.assignMember(sprintMemberRecipe);

      return sprintMember;
    }
  ),

  startSprint: SeedingFactory.make(
    async ({ api }, recipe?: StartSprintRecipe) => {
      const startSprintRecipe = {
        id: recipe?.id ?? (await sprintFactory.createSprint()).id,
        startedAt: recipe?.startedAt ?? new Date(),
      };

      await api.sprint.upstart({ ...startSprintRecipe });

      return true;
    }
  ),

  completeSprint: SeedingFactory.make(
    async ({ api }, recipe?: CompleteSprintRecipe) => {
      const completeSprintRecipe = {
        id: recipe?.id ?? (await sprintFactory.createSprint()).id,
        completedAt: recipe?.completedAt ?? new Date(),
      };

      if (!recipe?.id) {
        throw new Error("Sprint ID is required for completing a sprint.");
      }

      await api.sprint.complete({ ...completeSprintRecipe });

      return true;
    }
  ),

  progressSprint: SeedingFactory.make(
    async ({ api }, recipe?: ProgressSprintRecipe) => {
      const progressSprintRecipe = {
        id: recipe?.id ?? (await sprintFactory.createSprint()).id,
        daysRemaining: recipe?.daysRemaining ?? undefined,
      };

      await api.sprint.progress(progressSprintRecipe);

      return true;
    }
  ),

  assignTask: SeedingFactory.make(
    async ({ faker, api }, recipe?: AssignSprintTaskRecipe) => {
      const taskRecipe: CreateSprintTaskInputType = {
        name: recipe?.name ?? "TAP-" + faker.number.int({ min: 100, max: 999 }),
        state: recipe?.state ?? faker.helpers.enumValue(State),
        days: recipe?.days ?? faker.number.int({ min: 1, max: 10 }),
        memberId: recipe?.memberId ?? (await memberFactory.createMember()).id,
        sprintId: recipe?.sprintId ?? (await sprintFactory.createSprint()).id,
      };

      const task = await api.sprint.createTask(taskRecipe);

      return task;
    }
  ),

  updateNotes: SeedingFactory.make(
    async ({ faker, api }, recipe?: UpdateSprintNotesRecipe) => {
      if (!recipe?.id) {
        throw new Error("Sprint ID is required for updating sprint notes.");
      }

      const sprintRecipe: UpdateSprintNotesInputType = {
        id: recipe?.id ?? (await sprintFactory.createSprint()).id,
        notes: recipe.notes ?? faker.lorem.paragraph(),
      };

      const sprint = await api.sprint.updateNotes(sprintRecipe);

      return sprint;
    }
  ),

  manageDeadlines: SeedingFactory.make(
    async ({ faker, api }, recipe?: ManageSprintDeadlinRecipe) => {
      const manageSprintDeadlineRecipe: ManageSprintDeadlineInputType = {
        colour: recipe?.colour ?? faker.color.rgb(),
        day: recipe?.day ?? 2,
        description: recipe?.description ?? faker.commerce.productDescription(),
        name: recipe?.name ?? faker.hacker.verb(),
        sprintId: recipe?.sprintId ?? (await sprintFactory.createSprint()).id,
        deadlineId: recipe?.deadlineId ?? undefined,
      };

      const deadline = await api.sprint.manageDeadlines(
        manageSprintDeadlineRecipe
      );

      return deadline;
    }
  ),
};
