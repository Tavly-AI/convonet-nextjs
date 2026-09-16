import { tool } from '@livekit/agents';
import type { JSONSchema7 } from 'json-schema';
import type { CustomFunctionTool } from '../../../../app/agents/_lib/functions/general-tools.ts';
import type { RuntimeAgentConfig } from '../../ingestion/get-agent-config.ts';

type ConfiguredCustomTool = Omit<CustomFunctionTool, 'url'> & {
    name: string;
    url: URL;
};

function configuredCustomTools(agentConfig: RuntimeAgentConfig): ConfiguredCustomTool[] {
    const names = new Set<string>();

    return agentConfig.config.generalTools.flatMap((configuredTool) => {
        if (configuredTool.type !== 'custom') return [];

        const name = configuredTool.name.trim();
        if (!name || names.has(name)) return [];

        try {
            const url = new URL(configuredTool.url.trim());
            if (url.protocol !== 'http:' && url.protocol !== 'https:') return [];

            names.add(name);
            return [{ ...configuredTool, name, url }];
        } catch {
            return [];
        }
    });
}

export function createCustomFunctionTools(agentConfig: RuntimeAgentConfig) {
    return configuredCustomTools(agentConfig).map((config) => {
        const execute = async (args: Record<string, unknown>, { abortSignal }: { abortSignal: AbortSignal }) => {
            try {
                return await executeRequest(config, args, abortSignal);
            } catch (error) {
                if (abortSignal.aborted) throw error;

                console.error(`Custom function "${config.name}" failed.`, error);
                return { status: 'error', message: error instanceof Error ? error.message : 'Custom function request failed.', };
            }
        };

        const common = { name: config.name, description: config.description.trim(), execute };

        return config.parameters ? tool({ ...common, parameters: config.parameters as unknown as JSONSchema7 }) : tool(common);
    });
}


// MISC CODE

// http requestion configurations

function requestUrl(config: ConfiguredCustomTool): URL {
    const url = new URL(config.url);

    for (const [key, value] of Object.entries(config.query_params ?? {})) {
        if (key.trim()) url.searchParams.set(key.trim(), value);
    }

    return url;
}

function responseResult(body: string): unknown {
    if (!body) return { status: 'success' };

    try {
        return JSON.parse(body) as unknown;
    } catch {
        return body;
    }
}

function requestHeaders(headers: Record<string, string> | undefined, includesBody: boolean): Headers {
    const result = new Headers();

    for (const [key, value] of Object.entries(headers ?? {})) {
        if (key.trim() && value.trim()) result.set(key.trim(), value.trim());
    }
    if (includesBody && !result.has('content-type')) result.set('content-type', 'application/json');

    return result;
}




// timeout and retry

const DEFAULT_TIMEOUT_MS = 120_000;
const MIN_TIMEOUT_MS = 1_000;
const MAX_TIMEOUT_MS = 600_000;

function timeoutMs(value: number | undefined): number {
    if (value === undefined || !Number.isFinite(value)) return DEFAULT_TIMEOUT_MS;
    return Math.min(Math.max(Math.floor(value), MIN_TIMEOUT_MS), MAX_TIMEOUT_MS);
}

function retryCount(value: number | undefined): number {
    if (value === undefined || !Number.isFinite(value)) return 0;
    return Math.min(Math.max(Math.floor(value), 0), 5);
}




// make req code logic

async function fetchOnce(config: ConfiguredCustomTool, args: Record<string, unknown>, abortSignal: AbortSignal,): Promise<unknown> {

    const method = config.method
    if (!method) return
    const includesBody = method === 'POST' || method === 'PUT' || method === 'PATCH';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new Error('Custom function request timed out.')), timeoutMs(config.timeout_ms));
    const onAbort = () => controller.abort(abortSignal.reason);

    abortSignal.addEventListener('abort', onAbort, { once: true });

    try {
        const body = config.args_at_root ? args : { name: config.name, args };
        const response = await fetch(requestUrl(config), {
            method,
            headers: requestHeaders(config.headers, includesBody),
            ...(includesBody ? { body: JSON.stringify(body) } : {}),
            signal: controller.signal,
        });
        const responseBody = await response.text();

        if (!response.ok) throw new Error(`Custom function returned HTTP ${response.status}.`);

        return responseResult(responseBody);
    } finally {
        clearTimeout(timeout);
        abortSignal.removeEventListener('abort', onAbort);
    }
}

async function executeRequest(config: ConfiguredCustomTool, args: Record<string, unknown>, abortSignal: AbortSignal,): Promise<unknown> {

    let lastError: unknown;

    for (let attempt = 0; attempt <= retryCount(config.max_retry); attempt += 1) {
        if (abortSignal.aborted) throw new Error('Custom function request was cancelled.');

        try {
            return await fetchOnce(config, args, abortSignal);
        } catch (error) {
            if (abortSignal.aborted) throw error;
            lastError = error;
        }
    }

    throw lastError;
}
