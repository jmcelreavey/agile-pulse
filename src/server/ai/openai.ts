import { env, integrations } from "~/env";

/**
 * One short completion from OpenAI, or null when no key is set or the call fails. Callers always
 * have a deterministic answer ready, so AI only ever adds to a result and never blocks it.
 */
export async function complete(system: string, user: string, options: { maxTokens?: number; json?: boolean } = {}) {
  if (!integrations.openai) return null;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.3,
        max_tokens: options.maxTokens ?? 200,
        ...(options.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!response.ok) throw new Error(`OpenAI returned ${response.status}`);
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("OpenAI call failed; using the built-in answer.", error instanceof Error ? error.message : error);
    return null;
  }
}
