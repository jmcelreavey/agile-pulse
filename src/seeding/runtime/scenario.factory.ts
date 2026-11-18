import { type FactoryHelpers, type Logger } from "~/seeding/factories/factory";

export type ScenarioFunction = (helpers: FactoryHelpers) => Promise<unknown>;

export type ScenarioSettings = {
  /**
   * If not provided, faker's random generator will be seeded using a digest from the scenario name.
   *
   * If you want the scenario to be consistent even if renamed, you can set a seed value manually.
   */
  seed?: number;
};

export function createScenario(
  name: string,
  fn: ScenarioFunction,
  settings?: ScenarioSettings
) {
  return [name, fn, settings] as const;
}

export function getLogger(logger?: Logger) {
  return logger ? logger : console.log;
}

export async function execMultiple<T>(
  count: number,
  createFn: (index: number) => Promise<T>,
  logName = "item",
  logger?: Logger
): Promise<T[]> {
  logger?.(`Creating ${count} ${logName}(s)...`);

  const promises: T[] = [];
  for (let i = 0; i < count; i++) {
    promises.push(await createFn(i));
  }

  const results = await Promise.all(promises);

  logger?.(`Created ${count} ${logName}(s).`);

  return results;
}
