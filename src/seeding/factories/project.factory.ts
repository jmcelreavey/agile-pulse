import { SeedingFactory } from "~/seeding/factories/factory";
import {
  type CompleteProjectInputType,
  type CreateProjectInputType,
  type DeleteProjectInputType,
  type StartProjectInputType,
  type UpdateProjectNotesInputType,
} from "~/server/api/schemas/project";
import { type UpdateProjectType } from "~/server/logic/project/UpdateProjectUseCase";
import { State, isState } from "~/shared/types/State";

export type ProjectCreateRecipe = Partial<CreateProjectInputType>;
export type ProjectUpdateRecipe = Partial<UpdateProjectType>;
export type ProjectRemoveRecipe = Partial<DeleteProjectInputType>;
export type ProjectCompleteRecipe = Partial<CompleteProjectInputType>;
export type ProjectStartRecipe = Partial<StartProjectInputType>;
export type UpdateProjectNotesRecipe = Partial<UpdateProjectNotesInputType>;

function capitalizeWords(str: string): string {
  return str.replace(/(?:^|\s|-)\S/g, (match) => match.toUpperCase());
}

export const projectFactory = {
  createProject: SeedingFactory.make(
    async ({ faker, api }, recipe?: ProjectCreateRecipe) => {
      const projectRecipe = {
        name: capitalizeWords(
          recipe?.name ?? `${faker.hacker.adjective()} ${faker.animal.type()}`
        ),
        description: recipe?.description ?? faker.company.catchPhrase(),
        colour: recipe?.colour ?? faker.color.human(),
        state: recipe?.state ?? faker.helpers.enumValue(State),
      };

      if (!isState(projectRecipe.state)) {
        throw new Error("Invalid state provided for project.");
      }

      projectRecipe.state = projectRecipe.state ?? State.NOT_STARTED;

      const project = await api.project.create(projectRecipe);

      return project;
    }
  ),

  updateProject: SeedingFactory.make(
    async ({ faker, api }, recipe?: ProjectUpdateRecipe) => {
      if (!recipe?.id) {
        throw new Error("Project ID is required for updating a project.");
      }

      const projectRecipe = {
        id: recipe.id,
        name: capitalizeWords(
          recipe.name ?? `${faker.hacker.adjective()} ${faker.animal.type()}`
        ),
        description: recipe.description ?? faker.company.catchPhrase(),
        colour: recipe.colour ?? faker.color.human(),
        state: (recipe.state as State) ?? faker.helpers.enumValue(State),
      };

      if (!isState(projectRecipe.state)) {
        throw new Error("Invalid state provided for project.");
      }

      projectRecipe.state = projectRecipe.state ?? State.NOT_STARTED;

      const project = await api.project.update({
        ...projectRecipe,
      });

      return project;
    }
  ),

  delete: SeedingFactory.make(
    async ({ faker, api }, recipe?: ProjectRemoveRecipe) => {
      if (!recipe?.id) {
        throw new Error("Project ID is required for removing a project.");
      }

      const deleteRecipe = {
        id: recipe.id,
        reason: recipe.reason ?? faker.music.songName(),
      };

      const project = await api.project.delete({
        ...deleteRecipe,
      });

      return project;
    }
  ),
  startProject: SeedingFactory.make(
    async ({ api }, recipe?: ProjectStartRecipe) => {
      const completeProjectRecipe = {
        id: recipe?.id ?? (await projectFactory.createProject()).id,
        startedAt: recipe?.startedAt ?? new Date(),
      };

      const project = await api.project.start(completeProjectRecipe);

      return project;
    }
  ),
  completeProject: SeedingFactory.make(
    async ({ api }, recipe?: ProjectCompleteRecipe) => {
      const completeProjectRecipe = {
        id: recipe?.id ?? (await projectFactory.createProject()).id,
        completedAt: recipe?.completedAt ?? new Date(),
      };

      const project = await api.project.complete(completeProjectRecipe);

      return project;
    }
  ),
  updateNotes: SeedingFactory.make(
    async ({ faker, api }, recipe?: UpdateProjectNotesRecipe) => {
      if (!recipe?.id) {
        throw new Error("Project ID is required for updating sprint notes.");
      }

      const projectRecipe: UpdateProjectNotesInputType = {
        id: recipe?.id ?? (await projectFactory.createProject()).id,
        notes: recipe.notes ?? faker.lorem.paragraph(),
      };

      await api.project.updateNotes({
        id: recipe.id,
        notes: faker.company.catchPhraseDescriptor(),
      });

      const project = api.project.updateNotes({
        ...projectRecipe,
      });

      return project;
    }
  ),
};
