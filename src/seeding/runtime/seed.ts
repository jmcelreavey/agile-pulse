import { fakerEN_GB as faker } from "@faker-js/faker";
import chalk from "chalk";
import { seedSession } from "~/seeding/factories/factory";
import scenarios from "~/seeding/suite";
import { DEMO_USER } from "~/shared/demo";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "~/generated/prisma-node/client";
import { db, setDatabase, withSoftDelete } from "~/server/db";

setDatabase(
  withSoftDelete(
    new PrismaClient({
      adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" }),
    })
  )
);

const logo = `
   _____          .__.__             _________                 .___                     
  /  _  \\    ____ |__|  |   ____    /   _____/ ____   ____   __| _/                     
 /  /_\\  \\  / ___\\|  |  | _/ __ \\   \\_____  \\_/ __ \\_/ __ \\ / __ |                      
/    |    \\/ /_/  >  |  |_\\  ___/   /        \\  ___/\\  ___// /_/ |                      
\\____|__  /\\___  /|__|____/\\___  > /_______  /\\___  >\\___  >____ |                      
        \\//_____/              \\/          \\/     \\/     \\/     \\/                      
`;

console.log(chalk.yellow(logo));
console.log();

function stringToSeed(inputString: string): number {
  let hash = 0;
  for (let i = 0; i < inputString.length; i++) {
    const char = inputString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

async function runScenarios() {
  const scenarioPromises = scenarios.map(async ([name, scenario, settings]) => {
    console.log(chalk.green("Scenario: ") + chalk.white(`${name}`));

    if (settings?.seed) {
      faker.seed(settings.seed);
    } else {
      faker.seed(stringToSeed(name));
    }

    await scenario({
      faker,
      db,
      logger: (message, ...args) =>
        console.log(chalk.yellow("\t" + message), ...args),
    });
  });

  // Run scenarios in batches of 5 (or adjust as needed)
  const batchSize = 5;
  for (let i = 0; i < scenarioPromises.length; i += batchSize) {
    const batch = scenarioPromises.slice(i, i + batchSize);
    await Promise.all(batch);
  }
}

async function main() {
  const demoUser = await db.user.upsert({
    where: { email: DEMO_USER.email },
    update: {},
    create: { name: DEMO_USER.name, email: DEMO_USER.email, domain: DEMO_USER.domain },
  });
  seedSession.user.id = demoUser.id;

  await runScenarios();

  console.log();
  console.log();
  console.log(
    chalk.green("**************************************************")
  );
  console.log(
    chalk.green("******            SEEDING COMPLETE         *******")
  );
  console.log(
    chalk.green("******                                     *******")
  );
  console.log(
    chalk.green("******"),
    chalk.bgYellow("      Note: Database was reset     "),
    chalk.green("*******")
  );
  console.log(
    chalk.green("**************************************************")
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
