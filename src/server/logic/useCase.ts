/* eslint-disable @typescript-eslint/no-explicit-any */
import { type PrismaClient } from "~/generated/prisma/client";
import { db as prisma } from "~/server/db";

export class UseCase {
  constructor(protected db: PrismaClient = prisma) {}
}

export class AuthenticatedUseCase {
  constructor(
    protected db: PrismaClient = prisma,
    protected user: { id: number; domain: string }
  ) {}
}
export type getReturnType<T extends { execute: (...args: any[]) => any }> =
  ReturnType<T["execute"]> extends Promise<infer U> ? U : never;

export type getInputType<T extends { execute: (input: any) => any }> =
  Parameters<T["execute"]>[0];
