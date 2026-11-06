
import { audioEnhancement } from '@livekit/plugins-ai-coustics';
import type { RuntimeAgentConfig } from '../../ingestion/get-agent-config.ts';

// https://docs.livekit.io/transport/media/noise-cancellation/
export function realtime_transcription_resolveDenoisingMode(config: RuntimeAgentConfig['config']) {
  if (config.denoising_mode === 'no-denoise') return {};

  return {
    noiseCancellation: audioEnhancement({
      model: config.denoising_mode === 'noise-and-background-speech-cancellation' ? 'quailVfS' : 'quailL',
    }),
  };
}
