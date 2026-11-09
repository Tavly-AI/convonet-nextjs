import type { STTOptions } from '@livekit/agents-plugin-deepgram';
import type { RuntimeAgentConfig } from '../../ingestion/get-agent-config.ts';
import { BILLING_GLOBAL_CONFIG_VALUES } from '../../../../app/dashboard/billing/_lib/billing-payment-config.ts';

export function realtime_transcription_resolveTranscriptionMode(config: RuntimeAgentConfig['config']): Pick<STTOptions, 'endpointing'> {

  if (config.stt_mode !== 'custom') { return { endpointing: config.stt_mode === 'accurate' ? 500 : 25 }; }

  const provider = config.custom_stt_config?.provider?.trim().toLowerCase();

  if (provider && !(provider in BILLING_GLOBAL_CONFIG_VALUES.stt)) { throw new Error(`Unsupported custom STT provider: "${provider}". Only Deepgram is supported.`); }

  const endpointing = config.custom_stt_config?.endpointing_ms ?? 500;

  if (!Number.isInteger(endpointing) || endpointing < 0) { throw new Error('Custom STT endpointing_ms must be a finite, non-negative integer.'); }

  // The Deepgram plugin maps zero to disabled endpointing.
  return { endpointing };
}
