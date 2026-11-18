import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Prisma, PrismaClient } from "~/generated/prisma/client";
import { transformArgs } from "~/server/db/softDelete";

export type DB = PrismaClient;

type Adapter = NonNullable<NonNullable<ConstructorParameters<typeof PrismaClient>[0]>["adapter"]>;

const softDeleteExtension = Prisma.defineExtension({
  name: "soft-delete",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        return query(transformArgs(model, operation, args));
      },
    },
  },
});

/**
 * Apply soft delete to a Prisma client. Accepts the Node.js build of the client too, which has
 * the same shape. The extension only rewrites query arguments, so `DB` still describes it.
 */
export function withSoftDelete(client: { $extends: (extension: typeof softDeleteExtension) => unknown }): DB {
  return client.$extends(softDeleteExtension) as DB;
}

/** Build the Worker's Prisma client for a driver adapter, with soft delete applied. */
export function createPrismaClient(adapter: Adapter): DB {
  return withSoftDelete(
    new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    })
  );
}

const clients = new WeakMap<object, DB>();
let override: DB | undefined;

/** Scripts (seeding, tests) running outside the Worker supply their own client. */
export function setDatabase(client: DB) {
  override = client;
}

/** Resolve the client for the current request from the Cloudflare D1 binding. */
export function getDb(): DB {
  if (override) return override;
  const { env } = getCloudflareContext();
  const binding = env.DB;
  let client = clients.get(binding);
  if (!client) {
    client = createPrismaClient(new PrismaD1(binding));
    clients.set(binding, client);
  }
  return client;
}

/**
 * Request-scoped database handle. Property access is forwarded to the client for the current
 * request, so modules can import `db` at the top level as before.
 */
export const db: DB = new Proxy({} as DB, {
  get(_target, property) {
    const client = getDb();
    const value: unknown = Reflect.get(client, property);
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});
