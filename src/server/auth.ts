import type { DefaultSession } from "@auth/core/types";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Atlassian from "next-auth/providers/atlassian";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { env, integrations } from "~/env";
import { DEMO_USER } from "~/shared/demo";
import { db } from "~/server/db";

export type { Session } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      domain: string;
      role: "user" | "customer";
      isCustomer?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id?: number;
    domain: string;
    role?: "user" | "customer";
    isCustomer?: boolean;
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    domain: string;
    jiraAccessToken?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? `__Secure-next-auth.session-token`
          : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  // Local development gets a fixed secret; deployments must set AUTH_SECRET.
  secret: env.AUTH_SECRET ?? (env.NODE_ENV === "production" ? undefined : "agile-pulse-local-development-secret"),
  trustHost: true,
  pages: { signIn: "/sign-in" },
  providers: [
    ...(integrations.google
      ? [
          Google({
            clientId: env.AUTH_GOOGLE_ID,
            clientSecret: env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(integrations.jira
      ? [
          Atlassian({
            clientId: env.AUTH_JIRA_CLIENT_ID,
            clientSecret: env.AUTH_JIRA_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: "consent",
                scope:
                  "read:jira-work write:jira-work read:jira-user manage:jira-project manage:jira-configuration offline_access read:me read:board-scope:jira-software read:sprint:jira-software read:issue:jira-software read:issue-details:jira read:project:jira read:jql:jira",
              },
            },
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(env.DEMO_MODE || !integrations.google
      ? [
          Credentials({
            id: "demo",
            name: "Demo account",
            credentials: {},
            async authorize() {
              const user = await db.user.upsert({
                where: { email: DEMO_USER.email },
                update: {},
                create: { name: DEMO_USER.name, email: DEMO_USER.email, domain: DEMO_USER.domain },
              });
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                domain: user.domain ?? DEMO_USER.domain,
                role: "user" as const,
                isCustomer: false,
              };
            },
          }),
        ]
      : []),
    Credentials({
      id: "customer-credentials",
      name: "Customer Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const customer = await db.customer.findUnique({
          where: { email },
        });

        if (!customer) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          customer.hashedPassword
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          domain: customer.companyName ?? "",
          role: "customer" as "customer" | "user",
          isCustomer: true,
        };
      },
    }),
  ],
  callbacks: {
    session: ({ session, token, user }) => {
      // We need to check both token and user because credentials and oauth providers handle data differently
      const isCustomer =
        token?.role === "customer" ||
        token?.isCustomer === true ||
        user?.role === "customer" ||
        user?.isCustomer === true;

      // Create a new session object with the right types
      return {
        ...session,
        user: {
          ...session.user,
          id: Number(token?.sub ?? user?.id ?? ""),
          domain: (token?.domain as string) || user?.domain || "",
          role: isCustomer ? "customer" : "user",
          isCustomer: isCustomer,
        },
      };
    },
    jwt: ({ token, user }) => {
      // When signing in, copy user data to token
      if (user) {
        // Store customer info in token
        token.role = user.role;
        token.isCustomer = user.isCustomer;
        token.domain = user.domain;
      }
      return token;
    },
  },
  events: {
    createUser: async ({ user }) => {
      if (user.email) {
        const domain = user.email.split("@")[1] ?? "";
        await db.user.update({
          where: { email: user.email },
          data: { domain },
        });
      }
    },
    signIn: async ({ user, account }) => {

      if (
        (account?.provider === "google" || account?.provider === "atlassian") &&
        user?.email
      ) {
        const domain = user.email.split("@")[1] ?? "";

        const updateData: { domain: string; jiraAccessToken?: string } = {
          domain,
        };

        // Save Jira access token if this is an Atlassian sign-in
        if (account?.provider === "atlassian" && account?.access_token) {
          updateData.jiraAccessToken = account.access_token;
        }

        await db.user.update({
          where: { email: user.email },
          data: updateData,
        });
      }
    },
  },
});
