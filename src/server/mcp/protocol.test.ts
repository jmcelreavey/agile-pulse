import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineTool, handleMcpBody, handleMcpMessage } from "~/server/mcp/protocol";

const info = { name: "test", version: "1", instructions: "hi" };
const tools = [
  defineTool<{ user: string }, z.ZodObject<{ n: z.ZodNumber }>>({
    name: "double",
    title: "Double",
    description: "Doubles n",
    input: z.object({ n: z.number() }),
    inputSchema: { type: "object", properties: { n: { type: "number" } }, required: ["n"] },
    readOnly: true,
    run: async ({ n }, context) => ({ value: n * 2, user: context.user }),
  }),
];

describe("MCP protocol", () => {
  it("negotiates the protocol version", async () => {
    const reply = await handleMcpMessage({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26" } }, tools, { user: "u" }, info);
    expect(reply).toMatchObject({ id: 1, result: { protocolVersion: "2025-03-26", capabilities: { tools: {} } } });
  });

  it("lists and calls tools with the caller's context", async () => {
    const list = await handleMcpMessage({ jsonrpc: "2.0", id: 2, method: "tools/list" }, tools, { user: "u" }, info);
    expect(list).toMatchObject({ result: { tools: [{ name: "double", annotations: { readOnlyHint: true } }] } });
    const call = await handleMcpMessage({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "double", arguments: { n: 4 } } }, tools, { user: "u" }, info);
    expect(call).toMatchObject({ result: { structuredContent: { value: 8, user: "u" } } });
  });

  it("reports bad arguments as a tool error, unknown methods as JSON-RPC errors", async () => {
    const bad = await handleMcpMessage({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "double", arguments: { n: "x" } } }, tools, { user: "u" }, info);
    expect(bad).toMatchObject({ result: { isError: true } });
    const unknown = await handleMcpMessage({ jsonrpc: "2.0", id: 5, method: "nope" }, tools, { user: "u" }, info);
    expect(unknown).toMatchObject({ error: { code: -32601 } });
  });

  it("does not reply to notifications and handles batches", async () => {
    expect(await handleMcpMessage({ jsonrpc: "2.0", method: "notifications/initialized" }, tools, { user: "u" }, info)).toBeNull();
    const batch = await handleMcpBody([{ jsonrpc: "2.0", id: 1, method: "ping" }, { jsonrpc: "2.0", method: "notifications/initialized" }], tools, { user: "u" }, info);
    expect(batch).toEqual([{ jsonrpc: "2.0", id: 1, result: {} }]);
  });
});
