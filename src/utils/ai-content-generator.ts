import { env, integrations } from "~/env";
import { ChangelogTone, type TaskData } from "~/shared/types/changelog";

// Re-export for backward compatibility
export { ChangelogTone, type TaskData };

export interface ProjectContext {
  projectName: string;
  customerName?: string;
  projectDescription?: string;
}

export interface GenerateChangelogOptions {
  tasks: TaskData[];
  tone: ChangelogTone;
  projectContext?: ProjectContext;
}

/**
 * Generate changelog content using OpenAI
 */
export async function generateChangelogContent({
  tasks,
  tone,
  projectContext,
}: GenerateChangelogOptions): Promise<string> {
  const systemPrompt = getSystemPrompt(tone);
  const userPrompt = getUserPrompt(tasks, projectContext);

  if (!integrations.openai) {
    return writeChangelogOffline(tasks, projectContext);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });
    if (!response.ok) throw new Error(`OpenAI returned ${response.status}`);
    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content ?? "";
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error("Failed to generate changelog content", { cause: error });
  }
}

const CATEGORY_RULES: [heading: string, pattern: RegExp][] = [
  ["Bug Fixes", /\b(fix|bug|issue|error|crash|broken|resolve)/i],
  ["Enhancements", /\b(improve|update|refactor|optimi[sz]e|enhance|speed|tidy|polish)/i],
];

/**
 * Deterministic changelog used when no OpenAI key is configured. Groups tasks by keywords and
 * writes plain past-tense bullets, so the feature works offline and in the public demo.
 */
export function writeChangelogOffline(tasks: TaskData[], projectContext?: ProjectContext): string {
  const groups = new Map<string, TaskData[]>();
  for (const task of tasks) {
    const text = `${task.name} ${task.description}`;
    const heading = CATEGORY_RULES.find(([, pattern]) => pattern.test(text))?.[0] ?? "New Features";
    groups.set(heading, [...(groups.get(heading) ?? []), task]);
  }

  const order = ["New Features", "Enhancements", "Bug Fixes"];
  const sections = order
    .filter((heading) => groups.has(heading))
    .map((heading) => {
      const items = (groups.get(heading) ?? []).map((task) => `- ${task.name.trim().replace(/\.$/, "")}`);
      return `## ${heading}\n\n${items.join("\n")}`;
    });

  const intro = projectContext
    ? `This release of ${projectContext.projectName} includes ${tasks.length} completed ${tasks.length === 1 ? "task" : "tasks"}.`
    : `This release includes ${tasks.length} completed ${tasks.length === 1 ? "task" : "tasks"}.`;

  return [intro, ...sections].join("\n\n");
}

function getSystemPrompt(_tone: ChangelogTone): string {
  const basePrompt = `You are an expert technical writer creating clear, action-oriented changelog entries for software releases. Your task is to transform development task lists into concise release notes that clearly describe what was accomplished.

Guidelines:
- Write in past tense using direct action statements (e.g., "Added ability to...", "Improved performance of...", "Fixed issue with...")
- Group related tasks into logical categories (New Features, Enhancements, Bug Fixes, etc.)
- Use bullet points for easy scanning
- Focus on what was built, improved, or fixed rather than abstract benefits
- Be specific and concrete about changes
- Use clear, accessible language without unnecessary marketing speak
- Keep descriptions concise but informative
- Format as clean markdown with proper headers and bullet points
- Use British English spelling (colour, organised, realise, etc.)
- Maintain a professional and formal tone
- Include context about business impact where relevant
- Focus on functionality and capabilities delivered`;

  return basePrompt;
}

function getUserPrompt(
  tasks: TaskData[],
  projectContext?: ProjectContext
): string {
  const projectInfo = projectContext
    ? `Project: ${projectContext.projectName}${
        projectContext.customerName ? ` for ${projectContext.customerName}` : ""
      }${
        projectContext.projectDescription
          ? `\nProject Description: ${projectContext.projectDescription}`
          : ""
      }\n\n`
    : "";

  const taskList = tasks
    .map(
      (task) =>
        `- ${task.name}${
          task.description ? `\n  Description: ${task.description}` : ""
        }\n  Status: ${task.state}\n  Assigned to: ${task.assignedTo}`
    )
    .join("\n\n");

  return `${projectInfo}Please create a changelog entry for the following completed development tasks:

${taskList}

Transform these technical tasks into a clear, action-oriented changelog using direct past-tense statements. Use bullet points and organize by category (New Features, Enhancements, Bug Fixes, etc.). Focus on what was specifically built, improved, or fixed rather than abstract benefits. Start each item with action verbs like "Added", "Improved", "Fixed", "Removed", etc.`;
}

/**
 * Validate OpenAI API configuration
 */
export function validateOpenAIConfig(): boolean {
  return integrations.openai;
}
