import { llm } from '@livekit/agents';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONSchema7 } from 'json-schema';
import type { RuntimeAgentConfig } from '../../ingestion/get-agent-config.ts';
import { strictMcpSchema, mcpArguments } from './mcp-schema.ts';

export function createMcpToolsets({ llmConfig }: RuntimeAgentConfig): llm.Toolset[] {
  return (llmConfig.mcps ?? []).map((config, serverIndex) => {
    const id = `mcp_${serverIndex}`;
    const timeout = Number.isFinite(config.timeout_ms) && config.timeout_ms > 0 ? Math.floor(config.timeout_ms) : 120_000;
    const client = new Client({ name: 'voice-agent', version: '1.0.0' });

    return llm.Toolset.create({
      id, tools: [],
      setup: async ({ updateTools }) => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          const url = new URL(config.url);
          if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid MCP protocol');
          Object.entries(config.query_params ?? {}).forEach(([key, value]) => url.searchParams.set(key, value));

          const headers = config.headers ?? {};
          // Legacy SSE endpoints conventionally end in /sse; otherwise use Streamable HTTP.
          const transport = url.pathname.replace(/\/$/, '').endsWith('/sse')
            ? new SSEClientTransport(url, {
              requestInit: { headers },
              eventSourceInit: {
                fetch: (input, init) => {
                  const merged = new Headers(init?.headers);
                  for (const [key, value] of Object.entries(headers)) merged.set(key, value);
                  return fetch(input, { ...init, headers: merged });
                },
              },
            })
            : new StreamableHTTPClientTransport(url, { requestInit: { headers } });

          // Include transport startup in the timeout, not just MCP requests.
          await Promise.race([
            client.connect(transport as Transport, { timeout }),
            new Promise<never>((_, reject) => {
              timer = setTimeout(() => reject(new Error('MCP connection timed out')), timeout);
            }),
          ]);
          clearTimeout(timer);

          const tools: llm.FunctionTool[] = [];
          let cursor: string | undefined;
          do {
            const page = await client.listTools(cursor ? { cursor } : {}, { timeout });
            for (const remote of page.tools) tools.push(llm.tool({
              // Indexes avoid collisions between servers and locally defined tools.
              name: `${id}_${tools.length}_${remote.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`.slice(0, 64),
              description: `${config.name}: ${remote.description ?? remote.name}`,
              parameters: strictMcpSchema(remote.inputSchema as JSONSchema7),
              execute: async (args: Record<string, unknown>, { abortSignal }) => {
                try {
                  const result = await client.callTool(
                    { name: remote.name, arguments: mcpArguments(args, remote.inputSchema as JSONSchema7) }, undefined,
                    { timeout, signal: abortSignal },
                  );
                  if (result.isError) throw new llm.ToolError('MCP tool reported an error.');
                  return result.structuredContent ?? result.content;
                } catch (error) {
                  if (abortSignal.aborted) throw error;
                  throw new llm.ToolError('MCP tool request failed.');
                }
              },
            }));
            cursor = page.nextCursor;
          } while (cursor);
          updateTools(tools);
        } catch {
          // Do not log transport errors: they can contain authentication headers or query tokens.
          console.warn(`[MCP] Server ${serverIndex + 1} unavailable; continuing without its tools.`);
          await client.close().catch(() => {});
          updateTools([]);
        } finally {
          clearTimeout(timer);
        }
      },
      aclose: () => client.close(),
    });
  });
}
