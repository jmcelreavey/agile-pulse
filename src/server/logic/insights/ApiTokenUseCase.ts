import { randomToken, sha256Hex } from "~/server/integrations/signature";
import { UseCase } from "~/server/logic/useCase";

export const TOKEN_PREFIX = "ap_";

/** Personal access tokens for the MCP endpoint. The raw token is shown once and never stored. */
export class ApiTokenUseCase extends UseCase {
  list(userId: number) {
    return this.db.apiToken.findMany({
      where: { userId, revokedAt: null },
      select: { id: true, name: true, prefix: true, createdAt: true, lastUsedAt: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(userId: number, name: string) {
    const token = `${TOKEN_PREFIX}${randomToken(24)}`;
    const record = await this.db.apiToken.create({
      data: { userId, name, tokenHash: await sha256Hex(token), prefix: token.slice(0, 10) },
      select: { id: true, name: true, prefix: true, createdAt: true },
    });
    return { ...record, token };
  }

  async revoke(userId: number, id: number) {
    await this.db.apiToken.updateMany({ where: { id, userId }, data: { revokedAt: new Date() } });
    return { id };
  }

  /** The user a bearer token belongs to, or null. */
  async authenticate(token: string | null) {
    if (!token?.startsWith(TOKEN_PREFIX)) return null;
    const record = await this.db.apiToken.findFirst({
      where: { tokenHash: await sha256Hex(token), revokedAt: null },
      select: { id: true, user: { select: { id: true, name: true, email: true, domain: true } } },
    });
    if (!record) return null;
    await this.db.apiToken.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } });
    return record.user;
  }
}
