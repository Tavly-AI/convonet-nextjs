import { tool } from '@livekit/agents';
import { z } from 'zod';
import type {
  BookAppointmentCalTool,
  CheckAvailabilityCalTool,
} from '../../../../app/agents/_lib/functions/general-tools.ts';
import type { RuntimeAgentConfig } from '../../ingestion/get-agent-config.ts';

const CAL_API_VERSION = '2024-09-04';
const CAL_SLOTS_URL = 'https://api.cal.com/v2/slots';

type CalendarTool = CheckAvailabilityCalTool | BookAppointmentCalTool;

export function getCalConfig<T extends CalendarTool['type']>(agentConfig: RuntimeAgentConfig, type: T): Extract<CalendarTool, { type: T }> | null {
  const calendarTool = agentConfig.config.generalTools.find(
    (toolConfig): toolConfig is Extract<CalendarTool, { type: T }> =>
      toolConfig.type === type &&
      toolConfig.cal_api_key.trim() !== '' &&
      /^\d+$/.test(String(toolConfig.event_type_id).trim()),
  );

  return calendarTool ?? null;
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

type CalSlotResponse = {
  data?: Record<string, Array<string | { start?: string; time?: string }>>;
  message?: string;
};

function extractSlotStarts(data: CalSlotResponse): string[] {
  return Object.values(data.data ?? {}).flatMap((daySlots) =>
    daySlots.flatMap((slot) => {
      if (typeof slot === 'string') return [slot];
      const start = slot.start ?? slot.time;
      return start ? [start] : [];
    }),
  );
}

export function createCheckAvailabilityTool(agentConfig: RuntimeAgentConfig) {
  return tool({
    name: 'check_availability',
    description: 'Check Cal.com for bookable appointment times on a specific calendar date. Use this before offering or booking an appointment.',
    parameters: z.object({
      date: z.string().describe('The date to check in YYYY-MM-DD format, after confirming it with the caller.'),
    }),
    execute: async ({ date }, { abortSignal }) => {
      if (!isCalendarDate(date)) { return { status: 'error', message: 'The requested date must use YYYY-MM-DD format.' }; }

      const config = getCalConfig(agentConfig, "check_availability_cal");
      if (!config) { return { status: 'error', message: 'Calendar availability is not configured.' }; }

      const query = new URLSearchParams({
        eventTypeId: String(config.event_type_id).trim(),
        start: date,
        end: date,
        timeZone: config.timezone.trim() || agentConfig.config.timezone || 'UTC',
      });

      try {
        const response = await fetch(`${CAL_SLOTS_URL}?${query}`, {
          headers: {
            Authorization: `Bearer ${config.cal_api_key.trim()}`,
            'cal-api-version': CAL_API_VERSION,
          },
          signal: abortSignal,
        });

        const data = (await response.json().catch(() => ({}))) as CalSlotResponse;

        if (!response.ok) { return { status: 'error', message: 'Calendar availability could not be retrieved.' } }

        return { status: 'success', timeZone: config.timezone.trim() || agentConfig.config.timezone || 'UTC', slots: extractSlotStarts(data), };
      } catch (error) {
        if (abortSignal.aborted) throw error;
        return { status: 'error', message: 'Calendar availability could not be retrieved.' };
      }
    },
  });
}
