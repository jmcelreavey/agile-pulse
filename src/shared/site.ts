export const site = {
  name: "Agile Pulse",
  tagline: "Sprint planning you can see at a glance",
  description:
    "Agile Pulse is a sprint planner with a visual sprint chart, day-by-day snapshots, deadlines, a customer portal and release changelogs. Try the live demo, no account needed.",
  url: (process.env.SITE_URL ?? "http://localhost:3033").replace(/\/$/, ""),
  author: { name: "John McElreavey", url: "https://mcelreavey.com" },
  keywords: [
    "sprint planning",
    "agile",
    "scrum",
    "sprint chart",
    "project tracking",
    "customer portal",
    "changelog",
    "Next.js",
    "tRPC",
    "Prisma",
  ],
} as const;
