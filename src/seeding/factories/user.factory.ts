import { type User } from "~/generated/prisma/client";
import { SeedingFactory } from "~/seeding/factories/factory";
import { DEMO_USER } from "~/shared/demo";

export type UserRecipe = Partial<Pick<User, "name" | "email">>;

export const userRecipes = {
  admin: {
    name: DEMO_USER.name,
    email: DEMO_USER.email,
  },
} as const;

export const userFactory = {
  createUser: SeedingFactory.make(
    async ({ db, faker }, recipe?: UserRecipe) => {
      if (!recipe) {
        recipe = {};
      }

      if (!recipe.name) {
        recipe.name = faker.person.firstName();
      }

      // Check with prisma does this exist?
      let user = await db.user.findFirst({
        where: { name: recipe.name },
      });

      if (!user) {
        // If not - use the nominated hook to make it
        user = await db.user.create({
          data: {
            name: recipe.name,
            email: recipe.email ?? undefined,
            domain: DEMO_USER.domain,
          },
        });
      }

      return user;
    }
  ),
};
