import { tool } from '@livekit/agents';
import { z } from 'zod';
import type { RuntimeAgentConfig } from '../../ingestion/get-agent-config.ts';

/**
 * Awareness tool matching the LiveKit Python AwarenessTools.get_current_datetime implementation.
 */
export function createAwarenessTools(agentConfig: RuntimeAgentConfig) {
  const tzString =
    (agentConfig.llmConfig as Record<string, any>)?.timezone?.trim() ||
    agentConfig.config.timezone?.trim() ||
    'UTC';

  return tool({
    name: 'get_current_datetime',
    description: 'Check the current date and local time. Call this whenever the user asks for the time, date, or day of the week.',
    parameters: z.object({}),
    execute: async () => {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: tzString,
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        // Produces format identical to Python now.strftime("%A, %B %d, %Y at %I:%M %p"):
        // e.g. "Sunday, October 04, 2026 at 07:24 PM"
        const parts = formatter.formatToParts(now);
        const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
        const resultMsg = `${map.weekday}, ${map.month} ${map.day}, ${map.year} at ${map.hour}:${map.minute} ${map.dayPeriod?.toUpperCase() ?? ''}`.trim();

        console.log(`[AwarenessTool:get_current_datetime] Timezone: ${tzString} -> ${resultMsg}`);
        return resultMsg;
      } catch (error) {
        console.error(`AwarenessTool failed for ${tzString}:`, error);
        return "I'm sorry, I'm having trouble accessing the clock right now. Please try again in a moment.";
      }
    },
  });
}
