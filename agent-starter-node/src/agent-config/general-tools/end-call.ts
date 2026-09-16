import { beta } from '@livekit/agents';

// https://docs.livekit.io/agents/prebuilt/tools/end-call-tool/

export const endCallTool = beta.createEndCallTool({
    deleteRoom: true,
    endInstructions: 'Briefly thank the user and say goodbye.',
    ignoreOnEnter: true,
});
