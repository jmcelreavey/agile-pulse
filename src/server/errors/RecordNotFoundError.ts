// server code
import { TRPCError } from "@trpc/server";

export class RecordNotFoundError extends TRPCError {
  constructor(message?: string) {
    super({
      code: "NOT_FOUND",
      message: message ?? "Record not found",
    });
  }
}
