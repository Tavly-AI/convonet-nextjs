// optimize file use forking
import { tool } from '@livekit/agents';
import { runInNewContext } from 'node:vm';
import type { CodeTool } from '../../../../app/agents/_lib/functions/general-tools.ts';
import type { RuntimeAgentConfig } from '../../ingestion/get-agent-config.ts';

function getCodeTools(agentConfig: RuntimeAgentConfig): CodeTool[] {

    //  prevent duplicate code-tool names.
    const seenNames = new Set<string>();

    return agentConfig.config.generalTools.flatMap((configuredTool) => {
        if (configuredTool.type !== 'code') return [];

        const name = configuredTool.name.trim();
        if (!name || seenNames.has(name)) return [];

        seenNames.add(name);
        return [{ ...configuredTool, name }];
    });
}

export async function runConfiguredCode(code: string, timeoutMs: number | undefined, abortSignal: AbortSignal,): Promise<unknown> {
    const timeout = getTimeoutMs(timeoutMs);
    const result = runInNewContext(`(async () => {\n${code}\n})()`, Object.create(null), { timeout, });
    return normalizeCodeResult(await awaitResult(result, timeout, abortSignal));
}

export function createCodeExecutionTools(agentConfig: RuntimeAgentConfig) {
    return getCodeTools(agentConfig).map((config) =>
        tool({
            name: config.name,
            description: config.description.trim(),
            execute: async (_, { abortSignal }) => {
                try {
                    return await runConfiguredCode(config.code, config.timeout_ms, abortSignal);
                } catch (error) {
                    if (abortSignal.aborted) throw error;

                    console.error(`Configured code tool "${config.name}" failed.`, error);
                    return { status: 'error', message: error instanceof Error ? error.message : 'Code execution failed.', };
                }
            },
        }),
    );
}



// calc timeout

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 60_000;

function getTimeoutMs(timeoutMs: number | undefined): number {
    if (timeoutMs === undefined || !Number.isFinite(timeoutMs)) return DEFAULT_TIMEOUT_MS;
    return Math.min(Math.max(Math.floor(timeoutMs), 1), MAX_TIMEOUT_MS);
}



// run code

function abortError(): Error {
    return new Error('Code execution was cancelled.');
}

async function awaitResult(result: unknown, timeoutMs: number, abortSignal: AbortSignal): Promise<unknown> {
    if (abortSignal.aborted) throw abortError();

    return await new Promise<unknown>((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => finish(reject, new Error('Code execution timed out.')), timeoutMs);
        const onAbort = () => finish(reject, abortError());

        const finish = (callback: (value: unknown) => void, value: unknown,) => {
            if (settled) return;

            settled = true;
            clearTimeout(timer);
            abortSignal.removeEventListener('abort', onAbort);
            callback(value);
        };

        abortSignal.addEventListener('abort', onAbort, { once: true });
        Promise.resolve(result).then((value) => finish(resolve, value), (error: unknown) => finish(reject, error),);
    });
}


/**
 * Values created by node:vm belong to a separate JavaScript realm. LiveKit
 * validates object results with `instanceof Object`, so returning a sandbox
 * object directly makes an otherwise valid result appear invalid. Rebuild the
 * supported JSON-like values in this realm before giving them to LiveKit.
 */
function normalizeCodeResult(value: unknown, seen = new WeakSet<object>()): unknown {
    if (value === null || value === undefined) return value;

    if (typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number') {
        if (Number.isFinite(value)) return value;
        throw new TypeError('Code tool results cannot contain non-finite numbers.');
    }

    if (typeof value !== 'object') {
        throw new TypeError(`Code tool results must be JSON-like values; received ${typeof value}.`);
    }

    if (seen.has(value)) throw new TypeError('Code tool results cannot contain circular references.');
    seen.add(value);

    if (Array.isArray(value)) return value.map((item) => normalizeCodeResult(item, seen));

    if (Object.prototype.toString.call(value) !== '[object Object]') {
        throw new TypeError('Code tool results may only contain plain objects and arrays.');
    }

    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) result[key] = normalizeCodeResult(item, seen);
    return result;
}