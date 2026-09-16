import { tool } from '@livekit/agents';
import { z } from 'zod';
import type { RuntimeAgentConfig } from '../../ingestion/get-agent-config.ts';
import { getCalConfig } from './check-availability.ts';

const CAL_API_VERSION = '2024-09-04';
const CAL_BOOKINGS_URL = 'https://api.cal.com/v2/bookings';

function isIsoDateTime(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime()) && /T/.test(value);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

type CalBookingResponse = {
  data?: { uid?: string; id?: number | string };
};

export function createBookAppointmentTool(agentConfig: RuntimeAgentConfig) {
  return tool({
    name: 'book_appointment',
    description: 'Create a Cal.com appointment. Use only after the caller explicitly confirms the selected available time, their name, and their email address.',
    parameters: z.object({
      startTime: z.string().describe('The selected available slot as an ISO 8601 date-time returned by check_availability.'),
      name: z.string().describe('The attendee’s full name, confirmed with the caller.'),
      email: z.string().describe('The attendee’s email address, confirmed with the caller.'),
    }),
    execute: async ({ startTime, name: rawName, email: rawEmail }, { abortSignal }) => {

      // user input validations
      const name = rawName.trim();
      const email = rawEmail.trim();

      if (!isIsoDateTime(startTime)) { return { status: 'error', message: 'The appointment time must be a valid ISO 8601 date-time.' }; }
      if (!name) { return { status: 'error', message: 'The attendee name is required.' }; }
      if (!isEmail(email)) { return { status: 'error', message: 'The attendee email address must be valid.' }; }

      const config = getCalConfig(agentConfig, "book_appointment_cal");
      if (!config) { return { status: 'error', message: 'Calendar booking is not configured.' } }

      try {
        const response = await fetch(CAL_BOOKINGS_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.cal_api_key.trim()}`,
            'cal-api-version': CAL_API_VERSION,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            start: startTime,
            eventTypeId: Number(config.event_type_id),
            attendee: {
              name,
              email,
              timeZone: config.timezone.trim() || agentConfig.config.timezone || 'UTC',
            },
          }),
          signal: abortSignal,
        });

        const data = (await response.json().catch(() => ({}))) as CalBookingResponse;

        if (!response.ok) { return { status: 'error', message: 'The appointment could not be booked.' }; }

        return { status: 'success', message: 'The appointment was booked successfully.', bookingId: data.data?.uid ?? data.data?.id, };
      } catch (error) {
        if (abortSignal.aborted) throw error;
        return { status: 'error', message: 'The appointment could not be booked.' };
      }
    },
  });
}
