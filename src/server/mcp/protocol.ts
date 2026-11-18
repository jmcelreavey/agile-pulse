/**
 * A small, stateless Model Context Protocol server over Streamable HTTP. Each POST carries one
 * JSON-RPC message (or a batch) and gets a JSON reply; there are no sessions or server-sent
 * events, which keeps it a plain request handler that fits a Cloudflare Worker.
 */
import { type z } from "zod";

export const SUPPORTED_PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"] as const;

export type JsonRpcRequest = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: unknown };
export type JsonRpcResponse =
  | { jsonrpc: "2.0"; id: string | number | null; result: unknown }
  | { jsonrpc: "2.0"; id: string | number | null; error: { code: number; message: string; data?: unknown } };

export type McpTool<TContext, TSchema extends z.ZodType = z.ZodType> = {
  name: string;
  title: string;
  description: string;
  input: TSchema;
  /** JSON Schema shown to clients. Kept by hand so it reads well in tool pickers. */
  inputSchema: Record<string, unknown>;
  readOnly: boolean;
  run: (input: z.infer<TSchema>, context: TContext) => Promise<unknown>;
};

export const defineTool = <TContext, TSchema extends z.ZodType>(tool: McpTool<TContext, TSchema>) =>
  tool as unknown as McpTool<TContext>;

const error = (id: JsonRpcRequest["id"], code: number, message: string): JsonRpcResponse => ({
  jsonrpc: "2.0",
  id: id ?? null,
  error: { code, message },
});

export type ServerInfo = { name: string; version: string; instructions: string };

export async function handleMcpMessage<TContext>(
  message: unknown,
  tools: McpTool<TContext>[],
  context: TContext,
  info: ServerInfo
): Promise<JsonRpcResponse | null> {
  if (!message || typeof message !== "object" || (message as JsonRpcRequest).jsonrpc !== "2.0") {
    return error(null, -32600, "Invalid request");
  }
  const request = message as JsonRpcRequest;
  const isNotification = request.id === undefined;
  if (typeof request.method !== "string") return error(request.id, -32600, "Invalid request");

  const reply = (result: unknown): JsonRpcResponse | null =>
    isNotification ? null : { jsonrpc: "2.0", id: request.id ?? null, result };

  switch (request.method) {
    case "initialize": {
      const requested = (request.params as { protocolVersion?: string } | undefined)?.protocolVersion;
      const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.find((version) => version === requested) ?? SUPPORTED_PROTOCOL_VERSIONS[0];
      return reply({
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: info.name, version: info.version },
        instructions: info.instructions,
      });
    }
    case "ping":
      return reply({});
    case "tools/list":
      return reply({
        tools: tools.map((tool) => ({
          name: tool.name,
          title: tool.title,
          description: tool.description,
          inputSchema: tool.inputSchema,
          annotations: { title: tool.title, readOnlyHint: tool.readOnly, destructiveHint: false, openWorldHint: false },
        })),
      });
    case "tools/call": {
      const params = (request.params ?? {}) as { name?: string; arguments?: unknown };
      const tool = tools.find((candidate) => candidate.name === params.name);
      if (!tool) return error(request.id, -32602, `Unknown tool: ${String(params.name)}`);
      const parsed = tool.input.safeParse(params.arguments ?? {});
      if (!parsed.success) {
        return reply({
          content: [{ type: "text", text: `Invalid arguments: ${parsed.error.issues.map((issue) => `${issue.path.join(".") || "input"} ${issue.message}`).join("; ")}` }],
          isError: true,
        });
      }
      try {
        const result = await tool.run(parsed.data, context);
        const structured = result && typeof result === "object" && !Array.isArray(result) ? (result as Record<string, unknown>) : { result };
        return reply({ content: [{ type: "text", text: JSON.stringify(result, null, 2) }], structuredContent: structured });
      } catch (cause) {
        return reply({ content: [{ type: "text", text: cause instanceof Error ? cause.message : "Tool failed" }], isError: true });
      }
    }
    default:
      if (request.method.startsWith("notifications/")) return null;
      return error(request.id, -32601, `Method not found: ${request.method}`);
  }
}

/** Handle a POST body that may be a single message or a batch. */
export async function handleMcpBody<TContext>(body: unknown, tools: McpTool<TContext>[], context: TContext, info: ServerInfo) {
  if (Array.isArray(body)) {
    const replies = (await Promise.all(body.map((message) => handleMcpMessage(message, tools, context, info)))).filter(
      (reply): reply is JsonRpcResponse => reply !== null
    );
    return replies.length ? replies : null;
  }
  return handleMcpMessage(body, tools, context, info);
}
