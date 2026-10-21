import { Agent, handoff, tool, type voice } from "@livekit/agents"

import type { CF } from "../../../app/agents-conversational-flow/_types/global-cf-types.ts"
import type { RuntimeAgentConfig } from "../ingestion/get-agent-config.ts"
import { createAllAgentToolsAvailable } from "../sharable-code/agent-helpers.ts"

type FlowNode = CF["Node"]["data"]

export function createConversationalFlowAgentFromData(nodes: FlowNode[], agentConfig: RuntimeAgentConfig): Agent {

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
            instructions: `
                ${agentConfig.llmConfig.generalPrompt.trim() || "You are a helpful voice assistant."}\n\n
                ${node.instruction.text.trim() || "Continue helping the caller."}\n\n
                FLOW TRANSITIONS: ${defineConnectedToolInstructions(node, getNode)}
                AVAILABLE CONNECTED TOOLS: ${defineChainedToolInstructions(node, getNode)}
                LOGIC SPLITS: ${defineLogicSplitInstructions(node, getNode)}
                IMPORTANT: After every user response, check the transition conditions. If a condition is satisfied, you MUST immediately call its transition tool instead of responding to the user.
            `,

            onEnter(ctx) { resolveFirstNodeBeginMessage(ctx, node, nodes) },

            tools: [
                ...defineFlowForNonHandOffTools(agentConfig),
                ...defineFlowForHandOffTools(node, getNode, createNodeAgent),
            ],
        })
    }

    const begin = nodes.find(node => node.type === "begin")
    if (!begin?.edge.destination_node_id) throw new Error("The Begin node must connect to an executable node.")

    return createNodeAgent(begin.edge.destination_node_id)
}


type HandoffFlowNode = CF["Data"]["conversation"] | CF["Data"]["subagent"]

function defineFlowForNonHandOffTools(
    agentConfig: RuntimeAgentConfig,
) {
    return createAllAgentToolsAvailable(agentConfig)
}


function defineFlowForHandOffTools(node: HandoffFlowNode, getNode: (id: string) => FlowNode, createNodeAgent: (id: string) => Agent,) {
    return (node.edges ?? []).flatMap(edge => {

        const destination = edge.destination_node_id
        if (!destination) return []

        const destinationNode = getNode(destination)
        if (destinationNode.type !== "conversation" && destinationNode.type !== "subagent") { return [] }

        return [
            tool({
                name: `transition_${edge.id.replaceAll("-", "_")}`,
                description: edge.transition_condition.type === "prompt" ? edge.transition_condition.prompt : "Transition when the configured condition is satisfied.",
                execute: async () => handoff({ agent: createNodeAgent(destination), }),
            }),
        ]
    })
}



function defineConnectedToolInstructions(node: HandoffFlowNode, getNode: (id: string) => FlowNode,) {
    return (node.edges ?? []).map(edge => {
        if (!edge.destination_node_id) return null

        const destination = getNode(edge.destination_node_id)
        if (destination.type === "conversation" || destination.type === "subagent" || destination.type === "branch") { return null }

        const condition = edge.transition_condition.type === "prompt" ? edge.transition_condition.prompt : "when the transition condition is satisfied"
        return `- ${condition} → use the ${destination.type} tool.`

    }).filter(Boolean).join("\n")
}


function defineChainedToolInstructions(node: HandoffFlowNode, getNode: (id: string) => FlowNode,) {
    const tools = new Map<string, string>()
    const queue: FlowNode[] = []
    const visited = new Set<string>()

    function follow(node: FlowNode) {
        if (visited.has(node.id)) return
        visited.add(node.id)
        if (node.type === "conversation" || node.type === "subagent" || node.type === "branch") return

        if ("edges" in node) {
            node.edges?.forEach(edge => {
                if (edge.destination_node_id) {

                    const destination = getNode(edge.destination_node_id)
                    const condition = edge.transition_condition.type === "prompt" ? edge.transition_condition.prompt : "when the transition condition is satisfied"

                    tools.set(condition, destination.type)
                    queue.push(destination)
                }
            })
        }

        if ("else_edge" in node && node.else_edge?.destination_node_id) {

            const destination = getNode(node.else_edge.destination_node_id)
            tools.set("else", destination.type)
            queue.push(destination)
        }
    }

    node.edges?.forEach(edge => {
        if (edge.destination_node_id) {
            queue.push(getNode(edge.destination_node_id))
        }
    })

    while (queue.length) follow(queue.shift()!)

    return [...tools].map(([condition, tool]) => `- ${condition} → use the ${tool} tool.`).join("\n")
}


function defineLogicSplitInstructions(node: HandoffFlowNode, getNode: (id: string) => FlowNode) {
    const edges = (node.edges ?? []).flatMap(edge => {
        if (!edge.destination_node_id) return []

        const destination = getNode(edge.destination_node_id)
        if (destination.type !== "branch") return []

        const conditions = destination.edges.map(branchEdge => {
            if (branchEdge.transition_condition.type !== "prompt") {
                throw new Error(`Logic Split ${destination.id} requires prompt conditions.`)
            }
            return branchEdge.transition_condition.prompt
        })
        const incoming = edge.transition_condition.type === "prompt" ? edge.transition_condition.prompt : "when the transition condition is satisfied"

        return [...destination.edges, ...(destination.else_edge ? [destination.else_edge] : [])].map((branchEdge, index) => ({
            ...branchEdge,
            transition_condition: {
                type: "prompt" as const,
                prompt: `(${incoming}) AND ${index < conditions.length ? `(${conditions[index]}) AND ` : ""}none of these earlier conditions match: ${JSON.stringify(conditions.slice(0, index))}`,
            },
        }))
    })

    return edges.filter(edge => edge.destination_node_id).map(edge => {
        const destination = getNode(edge.destination_node_id!)
        if (destination.type === "conversation" || destination.type === "subagent" || destination.type === "branch") return null
        return `- ${edge.transition_condition.prompt} → use the ${destination.type} tool.`
    }).filter(Boolean).join("\n")
}


function resolveFirstNodeBeginMessage(ctx: voice.AgentContext, node: HandoffFlowNode, nodes: FlowNode[]) {

    const begin = nodes.find(node => node.type === "begin")
    if (begin?.edge.destination_node_id !== node.id) return

    if ("start_speaker" in node && node.start_speaker === "user") return

    const text = node.instruction.text.trim()
    if (!text) return

    if (node.instruction.type === "static_text") {
        ctx.session.say(text)
    } else {
        ctx.session.generateReply({ instructions: text })
    }
}