import { Agent, handoff, tool } from "@livekit/agents"

import type { CF } from "../../../app/agents-conversational-flow/_types/global-cf-types.ts"
import type { RuntimeAgentConfig } from "../ingestion/get-agent-config.ts"

type FlowNode = CF["Node"]["data"]

export function createInitialFlowAgent(nodes: FlowNode[], agentConfig: RuntimeAgentConfig): Agent {

    const getNode = (id: string) => {
        const node = new Map(nodes.map(node => [node.id, node])).get(id)
        if (!node) throw new Error(`Flow node ${id} does not exist.`)
        return node
    }

    const createNodeAgent = (id: string): Agent => {
        const node = getNode(id)
        if (node.type !== "conversation" && node.type !== "subagent") {
            throw new Error(`Flow node ${id} has unsupported type: ${node.type}`)
        }

        return Agent.create({
            instructions: `${agentConfig.llmConfig.generalPrompt.trim() || "You are a helpful voice assistant."}\n\n${node.instruction.text.trim() || "Continue helping the caller."}\n\nUse a transition tool only when its condition is satisfied.`,
            tools: (node.edges ?? []).flatMap(edge => {
                const destination = edge.destination_node_id
                if (!destination) return []

                return [tool({
                    name: `transition_${edge.id.replaceAll("-", "_")}`,
                    description: edge.transition_condition.type === "prompt" ? edge.transition_condition.prompt : "Transition when the configured condition is satisfied.",
                    execute: async () => handoff({ agent: createNodeAgent(destination), returns: `Transitioned to ${destination}.` }),
                })]
            }),
        })
    }

    const begin = nodes.find(node => node.type === "begin")
    if (!begin?.edge.destination_node_id) throw new Error("The Begin node must connect to an executable node.")

    return createNodeAgent(begin.edge.destination_node_id)
}
