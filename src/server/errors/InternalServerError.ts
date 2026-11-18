import { TRPCError } from "@trpc/server";

export class InternalServerError extends TRPCError {
  constructor(message?: string, cause?: unknown) {
    super({
      code: "INTERNAL_SERVER_ERROR",
      message: message ?? "Internal server error",
      cause,
    });
  }
}
