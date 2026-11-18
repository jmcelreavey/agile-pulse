import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const flag = z
  .enum(["true", "false"])
  .optional()
  .transform((value) => value === "true");

/**
 * Every integration is optional. Without keys the app runs fully offline: sign-in uses the demo
 * account, changelogs use the built-in writer, and emails are logged instead of sent.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    AUTH_SECRET: z.string().optional(),
    AUTH_URL: z.url().optional(),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
    AUTH_JIRA_CLIENT_ID: z.string().optional(),
    AUTH_JIRA_CLIENT_SECRET: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().default("gpt-4o-mini"),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default("Agile Pulse <noreply@example.com>"),
    DEMO_MODE: flag,
    SITE_URL: z.url().default("http://localhost:3033"),
    INCLUDE_PERFORMANCE_SCENARIOS: flag,
  },
  client: {
    NEXT_PUBLIC_MODE: z.enum(["development", "test", "production"]).default("development"),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    AUTH_JIRA_CLIENT_ID: process.env.AUTH_JIRA_CLIENT_ID,
    AUTH_JIRA_CLIENT_SECRET: process.env.AUTH_JIRA_CLIENT_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    DEMO_MODE: process.env.DEMO_MODE,
    SITE_URL: process.env.SITE_URL,
    INCLUDE_PERFORMANCE_SCENARIOS: process.env.INCLUDE_PERFORMANCE_SCENARIOS,
    NEXT_PUBLIC_MODE: process.env.NEXT_PUBLIC_MODE,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});

export const integrations = {
  google: Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET),
  jira: Boolean(env.AUTH_JIRA_CLIENT_ID && env.AUTH_JIRA_CLIENT_SECRET),
  openai: Boolean(env.OPENAI_API_KEY),
  email: Boolean(env.RESEND_API_KEY),
};
