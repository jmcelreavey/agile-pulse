import { seedSession } from "~/seeding/factories/factory";
import { createScenario } from "~/seeding/runtime/scenario.factory";
import { appRouter } from "~/server/api/root";
import { createCallerFactory } from "~/server/api/trpc";
import { State } from "~/shared/types/State";

/** Share token for the demo's public sprint link, so the docs can point at it. */
export const DEMO_SHARE_TOKEN = "demo-checkout-sprint";

const MEMBERS = ["Aisha Khan", "Ben Okafor", "Chloe Martin", "Dev Patel"] as const;
type Member = (typeof MEMBERS)[number];

/** Lanes for the in-progress sprint: [task, days, Jira key, member]. */
const PLAN: [string, number, string | null, Member][] = [
  ["Checkout API", 3, "PAY-101", "Aisha Khan"],
  ["Payment webhooks", 3, "PAY-102", "Aisha Khan"],
  ["Refund flow", 3, "PAY-103", "Aisha Khan"],
  ["Basket redesign", 4, "PAY-104", "Ben Okafor"],
  ["Address lookup", 2, "PAY-105", "Ben Okafor"],
  ["Order emails", 2, "PAY-106", "Ben Okafor"],
  ["Card form validation", 2, "PAY-107", "Chloe Martin"],
  ["3-D Secure challenge", 4, "PAY-108", "Chloe Martin"],
  ["Receipt PDF", 2, "PAY-109", "Chloe Martin"],
  ["Annual leave", 2, null, "Chloe Martin"],
  ["Fraud rules", 3, "PAY-110", "Dev Patel"],
  ["Load testing", 2, "PAY-111", "Dev Patel"],
  ["Analytics events", 3, "PAY-112", "Dev Patel"],
];

/**
 * A scripted sprint for the forecast, standup, retro and sync features: six days in, with a QA
 * bounce, an estimate that grew, a blocker, work added mid-sprint, leave, and linked PRs.
 */
export const checkoutScenario = createScenario("Create the Checkout project with a scripted sprint history", async ({ db, logger }) => {
  const api = createCallerFactory(appRouter)({ headers: new Headers(), db, session: seedSession });
  const DAY = 86_400_000;
  const now = Date.now();

  const project = await api.project.create({
    name: "Checkout",
    description: "Rebuilding the shop's checkout: payments, basket and receipts",
    colour: "indigo",
    state: State.IN_PROGRESS,
    jiraProjectKey: "PAY",
  });
  await api.project.start({ id: project.id });
  await api.project.updateNotes({ id: project.id, notes: "Sample project for the forecast, standup, retro and planner features." });

  const memberIds = new Map<Member, number>();
  for (const name of MEMBERS) memberIds.set(name, (await api.member.create({ name })).id);
  const memberId = (name: Member) => memberIds.get(name) ?? 0;

  // Sprint 1, completed: gives the planner a velocity history (Ben left 2 days of work undone).
  const past = await api.sprint.create({ projectId: project.id, reference: "C1", days: 10, daysRemaining: 10 });
  const pastWork: [string, number, Member, State][] = [
    ["Product page tidy-up", 4, "Aisha Khan", State.COMPLETED],
    ["Stock checks", 6, "Aisha Khan", State.COMPLETED],
    ["Basket service", 8, "Ben Okafor", State.COMPLETED],
    ["Saved cards", 2, "Ben Okafor", State.NOT_STARTED],
    ["Design tokens", 5, "Chloe Martin", State.COMPLETED],
    ["Accessibility fixes", 5, "Chloe Martin", State.COMPLETED],
    ["Payment provider spike", 3, "Dev Patel", State.COMPLETED],
    ["CI pipeline", 6, "Dev Patel", State.COMPLETED],
  ];
  for (const [name, days, member, state] of pastWork) {
    await api.sprint.createTask({ sprintId: past.id, name, days, memberId: memberId(member), state });
  }
  await api.sprint.upstart({ id: past.id });
  for (let day = 0; day < 10; day++) await api.sprint.progress({ id: past.id });
  await api.sprint.complete({ id: past.id });

  // Sprint 2, in progress.
  const sprint = await api.sprint.create({ projectId: project.id, reference: "C2", days: 10, daysRemaining: 10 });
  const tasks = new Map<string, { sprintTaskId: number; taskId: number; days: number; member: Member }>();
  for (const [name, days, key, member] of PLAN) {
    const created = await api.sprint.createTask({
      sprintId: sprint.id,
      name,
      days,
      memberId: memberId(member),
      state: key ? State.NOT_STARTED : State.LEAVE,
    });
    tasks.set(name, { sprintTaskId: created.id, taskId: created.taskId, days, member });
    if (key) await db.task.update({ where: { id: created.taskId }, data: { jiraIssueKey: key } });
  }
  await api.sprint.manageDeadlines({ sprintId: sprint.id, day: 8, name: "Code freeze", colour: "orange", description: "No new features after today" });
  await api.sprint.manageDeadlines({ sprintId: sprint.id, day: 10, name: "Release 2.4", colour: "red", description: "Checkout goes live" });

  const set = async (name: string, state: State, days?: number) => {
    const task = tasks.get(name);
    if (!task) throw new Error(`Unknown task ${name}`);
    if (days) task.days = days;
    await api.sprint.updateTask({ id: task.sprintTaskId, sprintId: sprint.id, name, state, days: task.days, memberId: memberId(task.member) });
  };

  await api.sprint.upstart({ id: sprint.id });
  const script: (() => Promise<void>)[] = [
    async () => {
      await set("Checkout API", State.IN_PROGRESS);
      await set("Basket redesign", State.IN_PROGRESS);
      await set("Card form validation", State.IN_PROGRESS);
      await set("Fraud rules", State.IN_PROGRESS);
    },
    async () => {
      await set("Card form validation", State.WITH_QA);
    },
    async () => {
      await set("Card form validation", State.COMPLETED);
      await set("3-D Secure challenge", State.IN_PROGRESS);
      await set("Checkout API", State.WITH_QA);
      await set("Fraud rules", State.BLOCKED);
    },
    async () => {
      await set("Checkout API", State.IN_PROGRESS);
      await set("Basket redesign", State.IN_PROGRESS, 5);
    },
    async () => {
      await set("Checkout API", State.WITH_QA);
      await set("3-D Secure challenge", State.AT_RISK);
      const promo = await api.sprint.createTask({ sprintId: sprint.id, name: "Promo codes", days: 1, memberId: memberId("Dev Patel") });
      tasks.set("Promo codes", { sprintTaskId: promo.id, taskId: promo.taskId, days: 1, member: "Dev Patel" });
      await db.task.update({ where: { id: promo.taskId }, data: { jiraIssueKey: "PAY-113" } });
    },
    async () => {
      await set("Checkout API", State.COMPLETED);
      await set("Payment webhooks", State.WITH_QA);
      await set("Basket redesign", State.WITH_QA);
      await set("Address lookup", State.IN_PROGRESS);
      await set("3-D Secure challenge", State.WITH_QA);
      await set("Fraud rules", State.COMPLETED);
      await set("Load testing", State.COMPLETED);
    },
  ];
  for (const step of script) {
    await step();
    await api.sprint.progress({ id: sprint.id });
  }
  await api.sprint.updateNotes({ id: sprint.id, notes: "Goal: card payments live behind a flag by the release on day 10." });

  const link = async (task: string, data: { provider: string; kind: string; externalId: string; url: string; title: string; status: string; daysAgo: number }) => {
    const { daysAgo, ...rest } = data;
    await db.taskLink.create({ data: { ...rest, taskId: tasks.get(task)?.taskId ?? 0, lastEventAt: new Date(now - daysAgo * DAY) } });
  };
  const repo = "https://github.com/agile-pulse-demo/checkout";
  await link("Checkout API", { provider: "github", kind: "pull_request", externalId: "agile-pulse-demo/checkout#41", url: `${repo}/pull/41`, title: "PAY-101 Checkout API", status: "merged", daysAgo: 1 });
  await link("Payment webhooks", { provider: "github", kind: "pull_request", externalId: "agile-pulse-demo/checkout#44", url: `${repo}/pull/44`, title: "PAY-102 Stripe-style webhooks", status: "in_review", daysAgo: 0 });
  await link("Basket redesign", { provider: "github", kind: "pull_request", externalId: "agile-pulse-demo/checkout#39", url: `${repo}/pull/39`, title: "PAY-104 New basket", status: "open", daysAgo: 5 });
  await link("Fraud rules", { provider: "github", kind: "issue", externalId: "agile-pulse-demo/checkout#37", url: `${repo}/issues/37`, title: "Sandbox keys for the fraud provider", status: "done", daysAgo: 1 });
  await link("3-D Secure challenge", { provider: "jira", kind: "issue", externalId: "PAY-108", url: "https://agile-pulse-demo.atlassian.net/browse/PAY-108", title: "3-D Secure challenge", status: "open", daysAgo: 0 });

  await db.shareLink.create({ data: { sprintId: sprint.id, token: DEMO_SHARE_TOKEN, createdById: seedSession.user.id } });

  // Sprint 3, not started: Chloe is off for three days, for the planner.
  const next = await api.sprint.create({ projectId: project.id, reference: "C3", days: 10, daysRemaining: 10 });
  await api.sprint.createTask({ sprintId: next.id, name: "Annual leave", days: 3, memberId: memberId("Chloe Martin"), state: State.LEAVE });
  for (const name of MEMBERS) await api.sprint.assignMember({ sprintId: next.id, memberId: memberId(name) });

  logger(`Checkout project created: sprint C2 is on day 6 with scripted history; share link /share/${DEMO_SHARE_TOKEN}.`);
});
