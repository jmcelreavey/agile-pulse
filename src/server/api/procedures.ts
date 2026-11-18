import { createTRPCProcedure } from "~/server/api/trpc";
import { auditMutationMiddleware } from "~/server/middleware/audit";
import {
  enforceCustomerIsAuthedMiddleware,
  enforceUserIsAuthedMiddleware,
} from "~/server/middleware/auth";

const auditProcedure = createTRPCProcedure.use(auditMutationMiddleware);
/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = auditProcedure;

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = auditProcedure.use(
  enforceUserIsAuthedMiddleware
);

/**
 * Customer Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in customers, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null and has customer role.
 *
 * @see https://trpc.io/docs/procedures
 */
export const customerProtectedProcedure = auditProcedure.use(
  enforceCustomerIsAuthedMiddleware
);
