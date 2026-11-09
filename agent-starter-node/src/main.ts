import { ServerOptions, cli, defineAgent, inference, voice } from '@livekit/agents';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createSinglePromptAgentFromData } from './single-prompt/single-prompt-runtime.ts';
import { createConversationalFlowAgentFromData } from './conversational-flow/conversational-flow-runtime.ts';
import { compileFlowSubflows } from './conversational-flow/helper-functions.ts';
import { getAgentConfig, getAgentIdFromJob, type RuntimeAgentConfig } from './ingestion/get-agent-config.ts';
import { getConversationalFlowConfig } from './ingestion/get-conversational-flow-config.ts';
import { createVoiceStack, type VoiceStack } from './ingestion/configure-voice-stack.ts';
import { registerSessionDataHooks } from './data-hooks/main.ts';
import { registerToolExecutionEvents } from './data-hooks/tool-events.ts';
import { registerS3DualChannelRecording } from './egress/upload-s3-egress.ts';
import { resolveSpeechSettingsPronunciation } from './agent-config/speech-settings/speech-settings-pronounciation.ts';
import { realtime_transcription_resolveDenoisingMode } from './agent-config/realtime-transcription-settings/realtime-transcription-denoising-mode.ts';
import { PER_SESSION_TEST_TYPE } from '../../app/agents/_components/main/agent-session-tertiary-server.ts'

dotenv.config({ path: '.env.local' });

export default defineAgent({
  entry: async (ctx) => {

    const agentId = getAgentIdFromJob(ctx);
    const agentConfig = await getAgentConfig(agentId);

    provisionForOverRideAgentChannelType(agentConfig, ctx.job.room?.name);

    const { llm, stt, tts } = await createVoiceStack(agentId, agentConfig);
    const agent = await createRuntimeAgent(agentId, agentConfig)

    const session = createSession({ llm, stt, tts }, agentConfig);
    registerToolExecutionEvents(ctx, session);
    registerSpeechSettingsReminders(ctx, session, agentConfig);
    await session.start({ agent, room: ctx.room, ...getSessionStartOptions(agentConfig) });

    if (agentConfig.channel === 'voice') {
      const egressRecording = registerS3DualChannelRecording(ctx);
      await egressRecording.start();
    }

    await ctx.connect();
    registerSessionDataHooks({ ctx, session, agentId });
    await resolveAmbientSound(ctx, session, agentConfig);
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: 'my-agent-123123',
  }),
);



// MISC STATIC CODE

async function createRuntimeAgent(agentId: string, agentConfig: RuntimeAgentConfig,) {
  if (agentConfig.config.agentType === "conversational_flow") {
    const flowSubflowConfig = await getConversationalFlowConfig(agentId)
    const flatGraph = compileFlowSubflows(flowSubflowConfig)
    return createConversationalFlowAgentFromData(flatGraph, agentConfig)
  }

  return createSinglePromptAgentFromData(agentConfig)
}

function createSession({ llm, stt, tts }: VoiceStack, { channel, config }: RuntimeAgentConfig) {
  const isChat = channel === 'chat';

  return new voice.AgentSession({
    llm,
    ...(isChat
      ? { vad: null, turnHandling: { turnDetection: null } }
      : {
        stt, tts, expressive: false,
        ttsTextTransforms: resolveSpeechSettingsPronunciation(tts, config.pronunciation_dictionary),
        userAwayTimeout: (config.reminder_trigger_ms ?? 10000) > 0 && (config.reminder_max_count ?? 1) > 0
          ? (config.reminder_trigger_ms ?? 10000) / 1000 : null,
        turnHandling: {
          turnDetection: new inference.TurnDetector(),
          endpointing: resolveSpeechSettingsResponsiveness(config),
          interruption: resolveSpeechSettingsInterruptionSensitivity(config),
          preemptiveGeneration: { enabled: false },
        },
      }),
  });
}

function getSessionStartOptions(agentConfig: RuntimeAgentConfig) {
  const isChat = agentConfig.channel === 'chat';

  return {
    record: { audio: false },
    inputOptions: isChat
      ? { textEnabled: true, audioEnabled: false, deleteRoomOnClose: true }
      : { deleteRoomOnClose: true, ...realtime_transcription_resolveDenoisingMode(agentConfig.config) },
    ...(isChat && {
      outputOptions: { transcriptionEnabled: true, audioEnabled: false, syncTranscription: false },
    }),
  };
}

function provisionForOverRideAgentChannelType(agentConfig: RuntimeAgentConfig, roomName: string | undefined) {
  if (!roomName) { throw new Error('Room name is missing from job'); }
  if (roomName.startsWith(`${PER_SESSION_TEST_TYPE.LLM}-`)) agentConfig.channel = 'chat';
}

// ==============================================================================
// ======================== SPEECH SETTINGS =====================================
// ==============================================================================

// https://docs.livekit.io/agents/logic/sessions/#handling-inactive-users
function registerSpeechSettingsReminders(ctx: Parameters<Parameters<typeof defineAgent>[0]["entry"]>[0], session: voice.AgentSession, { channel, config }: RuntimeAgentConfig) {
  const interval = config.reminder_trigger_ms ?? 10000;
  const maxCount = Math.floor(config.reminder_max_count ?? 1);
  if (channel !== 'voice' || interval <= 0 || maxCount <= 0) return;

  const events = voice.AgentSessionEventTypes;
  let count = 0;
  let hasSpoken = false;
  let closed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let reply: voice.SpeechHandle | undefined;

  async function remind() {
    if (closed || !hasSpoken || session.userState !== 'away' || session.agentState !== 'listening') return;
    if (count >= maxCount) {
      cleanup();
      session.shutdown();
      return;
    }
    count++;
    try {
      reply = session.generateReply({
        instructions: 'The user has been silent. Briefly check whether they are still present, using the conversation language and context. Do not call tools or end the call.',
        toolChoice: 'none',
      });
      await reply.waitForPlayout();
    } catch (error) {
      if (!closed) console.warn('[Reminders] Failed:', error);
    }
  }

  function onStateChanged(event: voice.UserStateChangedEvent | voice.AgentStateChangedEvent) {
    clearTimeout(timer);
    if (event.type === events.UserStateChanged && event.newState !== 'away') {
      reply?.interrupt(true);
      return;
    }
    if (event.type === events.AgentStateChanged && event.newState === 'speaking') hasSpoken = true;
    if (hasSpoken && session.userState === 'away' && session.agentState === 'listening') {
      timer = setTimeout(remind, event.type === events.UserStateChanged ? 0 : interval);
    }
  }

  function onUserTranscribed(event: voice.UserInputTranscribedEvent) {
    if (!event.isFinal || !event.transcript.trim()) return;
    count = 0;
    clearTimeout(timer);
    reply?.interrupt(true);
  }

  function cleanup() {
    closed = true;
    clearTimeout(timer);
    reply?.interrupt(true);
    session.off(events.UserStateChanged, onStateChanged);
    session.off(events.AgentStateChanged, onStateChanged);
    session.off(events.UserInputTranscribed, onUserTranscribed);
  }

  session.on(events.UserStateChanged, onStateChanged);
  session.on(events.AgentStateChanged, onStateChanged);
  session.on(events.UserInputTranscribed, onUserTranscribed);
  session.once(events.Close, cleanup);
  ctx.addShutdownCallback(async () => { cleanup(); });
}

async function resolveAmbientSound(ctx: Parameters<Parameters<typeof defineAgent>[0]["entry"]>[0], session: voice.AgentSession, agentConfig: RuntimeAgentConfig,) {
  if (agentConfig.channel !== 'voice') return;

  const ambientSound = agentConfig.config.ambient_sound;
  if (!ambientSound || ambientSound === 'none') return;

  const source = fileURLToPath(new URL(`../assets/background-sounds/${ambientSound}.mp3`, import.meta.url));
  if (!existsSync(source)) { console.warn(`Background sound file missing: ${source}`); return; }

  const backgroundAudio = new voice.BackgroundAudioPlayer({ ambientSound: { source, volume: 0.3 }, });

  ctx.addShutdownCallback(() => backgroundAudio.close());
  session.once(voice.AgentSessionEventTypes.Close, () => { void backgroundAudio.close(); });

  await backgroundAudio.start({ room: ctx.room, agentSession: session });
}

// https://docs.livekit.io/reference/agents/turn-handling-options/#dynamic-endpointing
function resolveSpeechSettingsResponsiveness(config: RuntimeAgentConfig["config"]): Partial<voice.EndpointingOptions> {
  const responsiveness = Math.max(0, Math.min(1, config.responsiveness ?? 0.84));

  // added custom-boundaries so user cannot select extreme values i guess ?
  const boundedResponsiveness = Math.max(0.2, Math.min(0.8, responsiveness));

  return {
    mode: config.enable_dynamic_responsiveness ? 'dynamic' : 'fixed',
    // Limit response delays to 380–1220 ms to avoid overly eager or patient extremes.
    minDelay: Math.round(1500 - boundedResponsiveness * 1400),
  };
}

// https://docs.livekit.io/reference/agents/turn-handling-options/#interruptionoptions
function resolveSpeechSettingsInterruptionSensitivity(config: RuntimeAgentConfig["config"]) {
  const sensitivity = Math.max(0, Math.min(1, config.interruption_sensitivity ?? 0.9));

  return {
    enabled: sensitivity > 0,
    mode: 'adaptive' as const,
    // Custom slider mapping; adaptive detection also controls interruption timing.
    minDuration: Math.round(1000 * (1 - sensitivity)),
    minWords: Math.ceil(3 * (1 - sensitivity)),
  };
}
