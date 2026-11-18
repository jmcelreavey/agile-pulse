import { type Forecast } from "~/shared/logic/insights/forecast";
import { round1 } from "~/shared/logic/insights/types";
import { addWorkingDays, formatDate } from "~/shared/logic/insights/workingDays";

export type Eta = {
  date: Date;
  confidence: "high" | "medium" | "low";
  text: string;
};

/**
 * Turn the forecast into a date a customer can plan around. Counts forward from today in working
 * days, so it stays honest even when the chart's day marker hasn't been moved for a while.
 */
export function etaFromForecast(forecast: Forecast, today: Date = new Date()): Eta {
  const daysLeft = Math.max(0, forecast.forecastEnd - forecast.currentDay);
  const date = addWorkingDays(today, daysLeft);
  const high = forecast.atRisk.filter((task) => task.severity === "high").length;
  const confidence: Eta["confidence"] =
    forecast.status === "done" || (forecast.status === "on-track" && high === 0)
      ? "high"
      : forecast.status === "late" || high >= 3
        ? "low"
        : "medium";
  const text =
    forecast.status === "done"
      ? "All planned work for this sprint is complete."
      : `We expect this sprint's work to be finished by ${formatDate(date)}` +
        (confidence === "high" ? "." : confidence === "medium" ? ", with a little risk." : ", but some items may move to the next sprint.");
  return { date, confidence, text };
}

export type WeeklyUpdateInput = {
  projectName: string;
  sprintReference: string;
  completed: string[];
  inProgress: string[];
  upNext: string[];
  forecast: Forecast;
  today?: Date;
};

/**
 * A plain-English weekly update for customers, drafted from completed work. No names, states or
 * estimates: customers asked what got done, what's next and when it lands.
 */
export function draftWeeklyUpdate(input: WeeklyUpdateInput) {
  const eta = etaFromForecast(input.forecast, input.today);
  const list = (items: string[], empty: string) => (items.length ? items.map((item) => `- ${item}`).join("\n") : `- ${empty}`);
  const progress = input.forecast.sprintDays
    ? Math.min(100, Math.round((input.forecast.currentDay / input.forecast.sprintDays) * 100))
    : 0;
  const markdown = [
    `## ${input.projectName}: weekly update`,
    "",
    `Sprint ${input.sprintReference} is ${progress}% of the way through (day ${round1(input.forecast.currentDay)} of ${input.forecast.sprintDays}).`,
    "",
    "**Done this week**",
    list(input.completed, "Groundwork on the items below; nothing new to show yet."),
    "",
    "**In progress**",
    list(input.inProgress, "Nothing in progress right now."),
    "",
    ...(input.upNext.length ? ["**Coming up**", list(input.upNext, ""), ""] : []),
    `**When**: ${eta.text}`,
  ].join("\n");
  return { subject: `${input.projectName}: weekly update`, markdown, eta };
}
