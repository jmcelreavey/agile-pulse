import { type Faker } from "@faker-js/faker";
import { faker } from "@faker-js/faker/locale/en_GB";
import { type PrismaClient } from "~/generated/prisma/client";
import chalk from "chalk";
import { appRouter } from "~/server/api/root";
import { createCallerFactory } from "~/server/api/trpc";
import { db } from "~/server/db";
import { DEMO_USER } from "~/shared/demo";

export type FactoryHelpers = {
  /**
   * A Faker instance already seeded to match the scenario name to ensure consitent
   * randomisation.
   */
  faker: Faker;

  /**
   * The Prisma client instance.
   */
  db: PrismaClient;

  /** A function to write important created items to the terminal. Ensures colour and
   * indentation for readability.
   */
  logger: (message: string, ...args: unknown[]) => void;

  /**
   * The API client for the application.
   */
  api?: ReturnType<typeof createCaller>;
};

export type SeedingFactory<TRecipe extends object | undefined, TReturn> = (
  helpers: FactoryHelpers & { api: ReturnType<typeof createCaller> },
  recipe?: TRecipe
) => Promise<TReturn>;

export type Logger = FactoryHelpers["logger"];

// 1. create a caller-function for your router
const createCaller = createCallerFactory(appRouter);

// 2. create a caller using your `Context`
/** The seed runs as the demo user. `seed.ts` fills in the id once the user exists. */
export const seedSession = {
  expires: new Date(Date.now() + 86_400_000).toISOString(),
  user: {
    id: 0,
    name: DEMO_USER.name,
    email: DEMO_USER.email,
    domain: DEMO_USER.domain,
    role: "user" as const,
  },
};

const api = createCaller({ headers: new Headers(), db, session: seedSession });

const logger = (message: string, ...args: unknown[]) =>
  console.log(chalk.yellow("\t" + message), ...args);

export const SeedingFactory = {
  make:
    <TRecipe extends object | undefined, TReturn>(
      func: SeedingFactory<TRecipe, TReturn>
    ) =>
    (recipe?: TRecipe) => {
      return func(
        {
          faker,
          db,
          logger,
          api,
        },
        recipe
      );
    },
};
