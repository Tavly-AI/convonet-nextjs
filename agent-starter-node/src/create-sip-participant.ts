import dotenv from 'dotenv';
import { LiveKitAPI, SipCallError } from 'livekit-server-sdk';

dotenv.config({ path: '.env.local' });

type ParsedArgs = {
  outboundTrunkId: string;
  phoneNumber: string;
  roomName: string;
  participantIdentity: string;
  participantName: string;
  agentName?: string;
  sipNumber?: string;
  waitUntilAnswered: boolean;
};

function printUsage(): void {
  console.error(`Usage:
  pnpm run create:sip-participant -- <outbound-trunk-id> <phone-number> [room-name] [--agent-name <agent-name>] [--identity <id>] [--name <name>] [--sip-number <from-number>] [--no-wait]

Examples:
  pnpm run create:sip-participant -- ST_1234567890 +14155550123
  pnpm run create:sip-participant -- ST_1234567890 +14155550123 sales-room --agent-name my-agent
  pnpm run create:sip-participant -- ST_1234567890 +14155550123 sales-room --name "Prospect"
  pnpm run create:sip-participant -- ST_1234567890 +14155550123 sales-room --sip-number +14155550999`);
}

function requireEnv(name: 'LIVEKIT_URL' | 'LIVEKIT_API_KEY' | 'LIVEKIT_API_SECRET'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseArgs(argv: string[]): ParsedArgs {
  if (argv.includes('--help') || argv.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const positional = argv.filter((arg) => !arg.startsWith('--'));
  const flags = new Map<string, string | boolean>();

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      continue;
    }

    if (arg === '--no-wait') {
      flags.set(arg, true);
      continue;
    }

    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${arg}`);
    }

    flags.set(arg, value);
    i += 1;
  }

  if (positional.length < 2) {
    throw new Error('Expected at least <outbound-trunk-id> and <phone-number>.');
  }

  const outboundTrunkId = positional[0];
  const phoneNumber = positional[1];
  const roomName = positional[2] ?? `sip-call-${Date.now()}`;

  return {
    outboundTrunkId,
    phoneNumber,
    roomName,
    agentName: typeof flags.get('--agent-name') === 'string' ? String(flags.get('--agent-name')) : 'my-agent-123123',
    participantIdentity: String(flags.get('--identity') ?? phoneNumber),
    participantName: String(flags.get('--name') ?? 'Phone Callee'),
    sipNumber:
      typeof flags.get('--sip-number') === 'string' ? String(flags.get('--sip-number')) : undefined,
    waitUntilAnswered: !flags.has('--no-wait'),
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const api = new LiveKitAPI({
    host: requireEnv('LIVEKIT_URL'),
    apiKey: requireEnv('LIVEKIT_API_KEY'),
    secret: requireEnv('LIVEKIT_API_SECRET'),
  });

  try {
    if (args.agentName) {
      await api.agentDispatch.createDispatch(args.roomName, args.agentName);
    }

    const participant = await api.sip.createSipParticipant(
      args.outboundTrunkId,
      args.phoneNumber,
      args.roomName,
      {
        participantIdentity: args.participantIdentity,
        participantName: args.participantName,
        waitUntilAnswered: args.waitUntilAnswered,
        ...(args.sipNumber ? { sipNumber: args.sipNumber } : {}),
      },
    );

    console.log(
      JSON.stringify(
        {
          agentName: args.agentName,
          roomName: args.roomName,
          participantIdentity: args.participantIdentity,
          sipCallTo: args.phoneNumber,
          participant,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    if (error instanceof SipCallError) {
      console.error(`SIP call failed: ${error.sipStatusCode} ${error.sipStatus}`);
      process.exit(1);
    }

    throw error;
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('Unknown error while creating SIP participant.');
  }

  printUsage();
  process.exit(1);
});
