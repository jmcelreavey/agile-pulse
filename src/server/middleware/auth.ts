import { TRPCError } from "@trpc/server";
import { createTRPCMiddleware } from "~/server/api/trpc";

/** Reusable middleware that enforces users are logged in before running the procedure. */
export const enforceUserIsAuthedMiddleware = createTRPCMiddleware(
  ({ ctx, next }) => {

    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        // infers the `session` as non-nullable
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  }
);

/** Reusable middleware that enforces customers are logged in before running the procedure. */
export const enforceCustomerIsAuthedMiddleware = createTRPCMiddleware(
  ({ ctx, next }) => {

    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // Check if user has customer role - consistent with middleware logic
    // Check both role and isCustomer property for compatibility
    const isCustomer =
      ctx.session.user.role === "customer" ||
      ctx.session.user.isCustomer === true;

    if (!isCustomer) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Customer access required",
      });
    }

    return next({
      ctx: {
        // infers the `session` as non-nullable
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  }
);
