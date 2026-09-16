import { getJobContext, tool } from '@livekit/agents';
import { z } from 'zod';
import type { PressDigitTool } from '../../../../app/agents/_lib/functions/general-tools.ts';
import type { RuntimeAgentConfig } from '../../ingestion/get-agent-config.ts';

const DTMF_CODES = {
    '0': 0,
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '*': 10,
    '#': 11,
} as const;

const digitSchema = z.enum(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#']);

export function getPressDigitConfig(agentConfig: RuntimeAgentConfig): PressDigitTool | null {
    const pressDigitTool = agentConfig.config.generalTools.find((configuredTool): configuredTool is PressDigitTool => configuredTool.type === 'press_digit',);
    return pressDigitTool ?? null;
}

export function createPressDigitTool(agentConfig: RuntimeAgentConfig) {

    const config = getPressDigitConfig(agentConfig);
    if (!config) return null;

    return tool({
        name: config.name.trim(),
        description: config.description.trim(),
        parameters: z.object({
            digit: digitSchema.describe('The single DTMF digit to send to the active phone menu.'),
        }),
        execute: async ({ digit }, { ctx, abortSignal }) => {
            if (!Number.isFinite(config.delay_ms) || config.delay_ms < 0 || config.delay_ms > 5000) { return 'The DTMF delay is not configured correctly.'; }

            if (config.delay_ms > 0) {
                await new Promise<void>((resolve) => setTimeout(resolve, config.delay_ms));
            }
            if (abortSignal.aborted) throw new Error('DTMF input was cancelled.');

            const room = ctx.session._roomIO?.rtcRoom ?? getJobContext().room;
            if (!room) { return 'A DTMF digit could not be sent because the LiveKit room is unavailable.' }

            const localParticipant = room.localParticipant;
            if (!localParticipant) { return 'A DTMF digit could not be sent because the local LiveKit participant is unavailable.'; }

            try {
                // https://docs.livekit.io/telephony/features/dtmf/
                await localParticipant.publishDtmf(DTMF_CODES[digit], digit);
                return `Sent DTMF digit ${digit}.`;
            } catch (error) {
                console.error('Sending DTMF digit failed.', error);
                return 'The DTMF digit could not be sent. Continue helping the caller.';
            }
        },
    });
}
