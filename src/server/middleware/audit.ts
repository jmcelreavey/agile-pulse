import dayjs from "dayjs";
import { createTRPCMiddleware } from "~/server/api/trpc";
import { db } from "~/server/db";

export const auditMutationMiddleware = createTRPCMiddleware(
  async ({ ctx, next, path, getRawInput, type }) => {
    const [routerName, functionName] = path.split(".");
    const result = await next();

    if (type === "mutation") {
      if (!routerName || !functionName) {
        console.error(
          `auditMutationMiddleware: Could not parse routerName and functionName from path ${path}`
        );
        return result;
      }

      const mutation = {
        functionName,
        routerName,
        inputs: JSON.stringify(await getRawInput()),
        createdById: ctx.session?.user?.id,
      };

      // Delete all audits older than 5 years
      await db.tRPCAudit.deleteMany({
        where: {
          updatedAt: {
            lt: dayjs().subtract(5, "year").toDate(),
          },
        },
      });

      await db.tRPCAudit.create({
        data: mutation,
      });
    }

    return result;
  }
);
