import type { JobContext } from "@livekit/agents";
import type { AgentSessionAgent } from "../../../app/agents/_lib/session-storage/agent-session.ts"

type JobMetadata = {
  agentId: string;
};

export type RuntimeAgentConfig = Pick<AgentSessionAgent, "channel" | "config" | "llmConfig">

export function getAgentIdFromJob(ctx: JobContext): string {
  if (!ctx.job.metadata) { throw new Error("Job metadata is missing"); }

  const metadata = JSON.parse(ctx.job.metadata) as JobMetadata;
  if (!metadata.agentId) { throw new Error("agentId is missing from job metadata"); }

  return metadata.agentId;
}


export async function getAgentConfig(agentId: string) {
  const baseUrl = process.env.NEXTJS_APP_URL ?? "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/agent/list-config?agentId=${encodeURIComponent(agentId)}`);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch agent config (${response.status}): ${body}`);
  }

  const agent = (await response.json()) as RuntimeAgentConfig

  // console.log("========== AGENT CONFIG ==========");
  // console.dir(agent, { depth: null });
  // console.log("==================================");


  return agent
}