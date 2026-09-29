import { ServerOptions, cli, defineAgent, inference, voice } from '@livekit/agents';
import { audioEnhancement } from '@livekit/plugins-ai-coustics';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createAgentDefinition } from './agent.ts';
import { getAgentConfig, getAgentIdFromJob, type RuntimeAgentConfig } from './ingestion/get-agent-config.ts';
import { createVoiceStack, type VoiceStack } from './ingestion/configure-voice-stack.ts';
import { registerSessionDataHooks } from './data-hooks/main.ts';
import { registerS3DualChannelRecording } from './egress/upload-s3-egress.ts';

dotenv.config({ path: '.env.local' });

export default defineAgent({
  entry: async (ctx) => {

    const agentId = getAgentIdFromJob(ctx);
    const agentConfig = await getAgentConfig(agentId);

    const { llm, stt, tts } = await createVoiceStack(agentId, agentConfig);
    const agent = createAgentDefinition(agentConfig);

    const session = createSession({ llm, stt, tts, channel: agentConfig.channel, });
    await session.start({ agent, room: ctx.room, ...getSessionStartOptions(agentConfig.channel) });

    if (agentConfig.channel === 'voice') {
      const egressRecording = registerS3DualChannelRecording(ctx);
      await egressRecording.start();
    }

    await ctx.connect();
    registerSessionDataHooks({ ctx, session, agentId });
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: 'my-agent-123123',
  }),
);



// MISC STATIC CODE

function createSession({ llm, stt, tts, channel }: VoiceStack & { channel: RuntimeAgentConfig["channel"] }) {
  const isChat = channel === 'chat';

  return new voice.AgentSession({
    llm,
    ...(isChat
      ? { vad: null, turnHandling: { turnDetection: null } }
      : {
        stt, tts, expressive: false,
        turnHandling: {
          turnDetection: new inference.TurnDetector(),
          interruption: { mode: 'adaptive' },
          preemptiveGeneration: { enabled: false },
        },
      }),
  });
}

function getSessionStartOptions(channel: RuntimeAgentConfig["channel"]) {
  const isChat = channel === 'chat';

  return {
    record: { audio: false },
    inputOptions: isChat
      ? { textEnabled: true, audioEnabled: false, deleteRoomOnClose: true }
      : { deleteRoomOnClose: true, noiseCancellation: audioEnhancement({ model: 'quailVfS' }) },
    ...(isChat && {
      outputOptions: { transcriptionEnabled: true, audioEnabled: false, syncTranscription: false },
    }),
  };
}