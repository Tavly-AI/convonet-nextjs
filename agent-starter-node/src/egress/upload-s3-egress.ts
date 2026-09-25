import { AudioMixing, S3Upload } from "@livekit/protocol"
import type { JobContext } from "@livekit/agents"
import { EgressClient, EncodedFileOutput, EncodedFileType } from "livekit-server-sdk"

type S3EgressRecording = {
    client: EgressClient
    egressId: string
    objectKey: string
}

async function startS3DualChannelRecording(roomName: string, jobId: string): Promise<S3EgressRecording | null> {
    const url = process.env.LIVEKIT_URL
    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET

    const accessKey = process.env.AWS_ACCESS_KEY_ID
    const secret = process.env.AWS_SECRET_ACCESS_KEY
    const region = process.env.AWS_REGION

    const bucket = process.env.CONVONENT_AWS_BUCKET
    const keyPrefix = process.env.EGRESS_RECORDINGS_S3_BUCKET_PREFIX?.replace(/^\/+|\/+$/g, "")

    if (!url || !apiKey || !apiSecret) { console.warn("Egress recording was not started because LiveKit credentials are missing."); return null }
    if (!accessKey || !secret || !region || !bucket || !keyPrefix) { console.warn("Egress recording was not started because S3 configuration is missing."); return null }

    const objectKey = `${keyPrefix}/${jobId}.ogg`
    const client = new EgressClient(url, apiKey, apiSecret)

    const egress = await client.startRoomCompositeEgress(
        roomName,
        new EncodedFileOutput({
            filepath: objectKey,
            fileType: EncodedFileType.OGG,
            output: {
                case: "s3",
                value: new S3Upload({ accessKey, secret, region, bucket }),
            },
        }),
        {
            audioOnly: true,
            audioMixing: AudioMixing.DUAL_CHANNEL_AGENT,
        },
    )

    console.info(`Started S3 dual-channel Egress recording ${egress.egressId} for room ${roomName}.`)
    return { client, egressId: egress.egressId, objectKey }
}

async function stopS3DualChannelRecording(recording: S3EgressRecording | null): Promise<void> {
    if (!recording) return

    await recording.client.stopEgress(recording.egressId)
    console.info(`Stopped Egress recording ${recording.egressId}; uploading to s3://${process.env.CONVONENT_AWS_BUCKET}/${recording.objectKey}.`)
}

export function registerS3DualChannelRecording(ctx: JobContext) {
    let recording: S3EgressRecording | null = null

    ctx.addShutdownCallback(async () => {
        try {
            await stopS3DualChannelRecording(recording)
        } catch (error) {
            console.error("Failed to stop the Egress recording.", error)
        }
    })

    return {
        async start() {
            if (!ctx.room.name) { console.warn("Egress recording was not started because the room name is missing."); return }

            try {
                recording = await startS3DualChannelRecording(ctx.room.name, ctx.job.id)
            } catch (error) {
                console.error("Failed to start the Egress recording.", error)
            }
        },
    }
}
