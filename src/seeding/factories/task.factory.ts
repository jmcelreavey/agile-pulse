import { SeedingFactory } from "~/seeding/factories/factory";
import { type UpdateSprintTaskInputType } from "~/server/api/schemas/sprint";
import { type DeleteTaskInputType } from "~/server/api/schemas/task";

export type UpdateTaskRecipe = Partial<UpdateSprintTaskInputType>;
export type RemoveTaskRecipe = Partial<DeleteTaskInputType>;

export const taskFactory = {
  delete: SeedingFactory.make(
    async ({ faker, api }, recipe?: RemoveTaskRecipe) => {
      if (!recipe?.id) {
        throw new Error("Task ID is required for removing a task.");
      }

      const deleteRecipe = {
        id: recipe.id,
        reason: recipe.reason ?? faker.music.songName(),
      };

      const deletedTask = await api.sprint.deleteTask(deleteRecipe);

      return deletedTask;
    }
  ),
};
