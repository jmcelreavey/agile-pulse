import { TRPCError } from "@trpc/server";

export class NotAuthorisedError extends TRPCError {
  constructor(message?: string) {
    super({
      code: "UNAUTHORIZED",
      message: message ?? "Not authorized",
    });
  }
}
