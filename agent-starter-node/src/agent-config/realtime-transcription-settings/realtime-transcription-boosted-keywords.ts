import type { STTOptions } from '@livekit/agents-plugin-deepgram';
import type { RuntimeAgentConfig } from '../../ingestion/get-agent-config.ts';

export function realtime_transcription_resolveBoostedKeywords(config: RuntimeAgentConfig['config']): Pick<STTOptions, 'keyterm'> {

  // Nova-3 uses keyterm prompting rather than the legacy keywords option.
  const keywords = (config.boosted_keywords ?? []).map((word) => word.trim()).filter(Boolean);
  return { keyterm: [...new Set(keywords)] };

}
