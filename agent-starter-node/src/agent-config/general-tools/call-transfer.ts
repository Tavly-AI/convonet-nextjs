import { type Agent, getJobContext, handoff, tool, workflows } from '@livekit/agents';
import { ParticipantKind } from '@livekit/rtc-node';
import { LiveKitAPI } from 'livekit-server-sdk';
import type { TransferCallTool } from '../../../../app/agents/_lib/functions/general-tools.ts';
import { type RuntimeAgentConfig, getAgentConfig } from '../../ingestion/get-agent-config.ts';

const E164_PHONE_NUMBER = /^\+[1-9]\d{7,14}$/;

export function getTransferConfig(agentConfig: RuntimeAgentConfig): TransferCallTool | null {
  const transferTool = agentConfig.config.generalTools.find(
    (configuredTool): configuredTool is TransferCallTool => configuredTool.type === 'transfer_call',
  );
  return transferTool ?? null;
}

/** @deprecated Use getTransferConfig; retained for callers that need cold-only filtering. */
export function getColdTransferConfig(agentConfig: RuntimeAgentConfig): TransferCallTool | null {
  const config = getTransferConfig(agentConfig);
  return config?.transfer_option.type === 'cold_transfer' ? config : null;
}

export function createCallTransferTool(agentConfig: RuntimeAgentConfig, createTargetAgent: (targetConfig: RuntimeAgentConfig) => Agent) {

  const config = getTransferConfig(agentConfig);
  if (!config) return null;

  return tool({
    name: config.name.trim() || 'transfer_call',
    description: config.description.trim() || 'Transfer the caller to the configured human agent.',

    execute: async (_, { ctx }) => {
      if (config.speak_during_execution && config.execution_message_description?.trim()) {
        const message = config.execution_message_description.trim();
        const speech = config.execution_message_type === 'static_text' ? ctx.session.say(message, { allowInterruptions: false }) : ctx.session.generateReply({ instructions: message, allowInterruptions: false });
        await speech.waitForPlayout();
      }

      const option = config.transfer_option;
      if (option.type !== 'cold_transfer' && option.public_handoff_option) {
        const publicHandoff = option.public_handoff_option;
        const speech = publicHandoff.type === 'static_message' ? ctx.session.say(publicHandoff.message, { allowInterruptions: false }) : ctx.session.generateReply({ instructions: publicHandoff.prompt, allowInterruptions: false, });
        await speech.waitForPlayout();
      }

      if (option.type === 'agentic_warm_transfer') {
        const target = option.agentic_transfer_config.transfer_agent;

        const agentId = target?.agent_id.trim();
        if (!agentId) { return 'Agentic transfer is not configured with a target agent.' }

        try {

          const targetConfig = await getAgentConfig(agentId);
          return handoff({ agent: createTargetAgent(targetConfig), returns: 'The conversation has been transferred to the specialist agent.', });

        } catch (error) {
          console.error('Agentic call transfer failed.', error);
          return 'The specialist agent is unavailable. Continue helping the caller and offer an alternative.';
        }
      }

      const destination = option.type === 'warm_transfer' ? normalizeWarmTransferDestination(config) : normalizeColdTransferDestination(config);
      if (!destination) { return option.type === 'warm_transfer' ? 'Warm transfer requires a valid predefined phone number or SIP URI.' : 'Call transfer is not configured with a valid static phone number or SIP URI.'; }

      if (option.type === 'warm_transfer') {

        if (!process.env.LIVEKIT_SIP_OUTBOUND_TRUNK) { return 'Warm transfer is unavailable because LIVEKIT_SIP_OUTBOUND_TRUNK is not configured.'; }

        const privateHandoff = option.private_handoff_option;
        try {
          const sipHeaders = getSipHeaders(config);
          const dtmf = getTransferDtmf(config);
          const greetingSpeech = privateHandoff?.type === 'static_message' ? privateHandoff.message.trim() || undefined : undefined;
          const instructions = privateHandoff?.type === 'prompt' && privateHandoff.prompt.trim() ? { extra: privateHandoff.prompt.trim() } : undefined;

          const task = new workflows.WarmTransferTask({
            sipCallTo: destination,
            sipTrunkId: process.env.LIVEKIT_SIP_OUTBOUND_TRUNK,
            ringingTimeout: Math.max(1_000, getRingingTimeoutSeconds(config) * 1_000),
            chatCtx: ctx.session.chatCtx,
            ...(sipHeaders ? { sipHeaders } : {}),
            ...(dtmf ? { dtmf } : {}),
            ...(greetingSpeech ? { greetingSpeech } : {}),
            ...(instructions ? { instructions } : {}),
            ...(option.on_hold_music === 'none' ? { holdAudio: null } : {}),
          });
          await task.run();
          return 'The caller is now connected to the human agent.';
        } catch (error) {
          console.error('Warm call transfer failed.', error);
          return 'The human agent could not be reached. Continue helping the caller and offer an alternative.';
        }
      }

      const room = ctx.session._roomIO?.rtcRoom ?? getJobContext().room;
      if (!room.name) return 'The call could not be transferred because the LiveKit room is unavailable.';
      const sipCaller = Array.from(room.remoteParticipants.values()).find((participant) => participant.kind === ParticipantKind.SIP);
      if (!sipCaller) return 'There is no active SIP caller available to transfer.';

      const api = createLiveKitApi();
      if (!api) return 'Call transfer is unavailable because LiveKit server credentials are not configured.';

      try {
        const headers = getSipHeaders(config);
        await api.sip.transferSipParticipant(room.name, sipCaller.identity, destination, {
          playDialtone: false,
          ringingTimeout: getRingingTimeoutSeconds(config),
          ...(headers ? { headers } : {}),
        });
        return 'The caller was transferred successfully.';
      } catch (error) {
        console.error('Cold call transfer failed.', error);
        return 'The call could not be transferred. Continue helping the caller and offer an alternative.';
      }
    },
  });
}



// MISC CODE

// ringtimeouts

const DEFAULT_RINGING_TIMEOUT_SECONDS = 30;

export function getRingingTimeoutSeconds(config: TransferCallTool): number {
  const ringDurationMs = config.transfer_option.transfer_ring_duration_ms;
  if (!Number.isFinite(ringDurationMs) || !ringDurationMs || ringDurationMs < 0) {
    return DEFAULT_RINGING_TIMEOUT_SECONDS;
  }
  return Math.max(1, Math.ceil(ringDurationMs / 1000));
}




// config functions

function createLiveKitApi(): LiveKitAPI | null {
  const host = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const secret = process.env.LIVEKIT_API_SECRET;
  return host && apiKey && secret ? new LiveKitAPI({ host, apiKey, secret }) : null;
}

function getSipHeaders(config: TransferCallTool): Record<string, string> | undefined {
  const headers = Object.fromEntries(
    Object.entries(config.custom_sip_headers ?? {}).flatMap(([name, value]) => {
      const key = name.trim();
      const headerValue = value.trim();
      return key && headerValue ? [[key, headerValue]] : [];
    }),
  );
  return Object.keys(headers).length ? headers : undefined;
}


export function normalizeColdTransferDestination(config: TransferCallTool): string | null {
  if (config.transfer_destination.type !== 'predefined') return null;
  const destination = config.transfer_destination.number.trim();
  if (!destination) return null;
  if (/^sips?:/i.test(destination)) return /\s/.test(destination) ? null : destination;
  const phoneNumber = destination.replace(/^tel:/i, '');
  if (!config.ignore_e164_validation && !E164_PHONE_NUMBER.test(phoneNumber)) return null;
  return `tel:${phoneNumber}`;
}

/**
 * `createSipParticipant` dials an outbound call and expects an E.164 number,
 * unlike a cold SIP REFER which expects a `tel:` or `sip:` transfer URI.
 */
export function normalizeWarmTransferDestination(config: TransferCallTool): string | null {
  if (config.transfer_destination.type !== 'predefined') return null;
  const destination = config.transfer_destination.number.trim();
  if (!destination) return null;

  if (/^sips?:/i.test(destination)) return /\s/.test(destination) ? null : destination;

  const phoneNumber = destination.replace(/^tel:/i, '');
  if (!config.ignore_e164_validation && !E164_PHONE_NUMBER.test(phoneNumber)) return null;
  return phoneNumber;
}

function getTransferDtmf(config: TransferCallTool): string | undefined {
  if (config.transfer_destination.type !== 'predefined') return undefined;
  const extension = config.transfer_destination.extension?.trim();
  // LiveKit accepts digits, * / #, and `w` as a ~0.5 s pause. Reject all other
  // characters rather than sending user-configured data directly to the dialer.
  return extension && /^[0-9*#wW]+$/.test(extension) ? extension : undefined;
}