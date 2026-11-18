import dayjs from "dayjs";
import { userFactory, userRecipes } from "~/seeding/factories/user.factory";
import { createScenario } from "~/seeding/runtime/scenario.factory";

export const sessionToken = "eyJ-0Nl0ngT0k3n";

export const createUsers = createScenario(
  "Create a standard user with a session for testing",
  async ({ logger, db }) => {
    const user = await userFactory.createUser(userRecipes.admin);
    await db.session.upsert({
      create: {
        id: user.id,
        userId: user.id,
        sessionToken,
        expires: dayjs().add(1, "day").toDate(),
      },
      update: {
        expires: dayjs().add(1, "day").toDate(),
      },
      where: {
        id: user.id,
      },
    });

    logger(`Users ${userRecipes.admin.email} created.`);
  }
);
