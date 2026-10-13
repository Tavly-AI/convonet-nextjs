// optimize file
import type { CF, CFSubflowComponent, MainflowSubflowConfig } from "../../../app/agents-conversational-flow/_types/global-cf-types.ts"

type FlowNode = CF["Node"]["data"]

export function compileFlowSubflows({ mainFlowConfig, subflowConfig }: MainflowSubflowConfig): FlowNode[] {
    const nodes = Object.values(mainFlowConfig)
    const subflowById = new Map(Object.values(subflowConfig).map(subflow => [subflow.conversation_flow_component_id, subflow]))
    const subflowNodes = nodes.filter((node): node is CF["Data"]["subflow"] => node.type === "subflow")
    const inlinedSubflows = new Map(subflowNodes.map(node => [node.id, createInlineSubflow(node, subflowById)]))

    const resolveMainDestination = (destinationNodeId: string) => inlinedSubflows.get(destinationNodeId)?.entryNodeId ?? destinationNodeId
    const compiledMainNodes = nodes.filter(node => node.type !== "subflow").map(node => withResolvedDestinations(node, resolveMainDestination))

    return [
        ...compiledMainNodes,
        ...[...inlinedSubflows.values()].flatMap(subflow => [
            ...subflow.nodes,
            withResolvedDestinations(subflow.returnNode, resolveMainDestination),
        ]),
    ]
}

function createInlineSubflow(subflowNode: CF["Data"]["subflow"], subflowById: Map<string | undefined, CFSubflowComponent>,): { entryNodeId: string; nodes: FlowNode[]; returnNode: CF["Data"]["conversation"] } {
    const component = subflowById.get(subflowNode.conversation_flow_component_id)
    if (!component) throw new Error(`Subflow ${subflowNode.conversation_flow_component_id} referenced by ${subflowNode.id} does not exist.`)
    if (component.nodes.some(node => node.type === "subflow")) { throw new Error(`Nested subflows are not supported: ${component.name}.`) }

    const startNode = component.start_node_id ? component.nodes.find(node => node.id === component.start_node_id) : component.nodes.find(node => node.type === "subflow_start")
    if (!startNode || startNode.type !== "subflow_start" || !startNode.edge.destination_node_id) { throw new Error(`Subflow ${component.name} must have a Start node connected to another node.`) }

    const endNodeIds = new Set(component.nodes.filter(node => node.type === "subflow_end").map(node => node.id))
    if (!endNodeIds.size) throw new Error(`Subflow ${component.name} must contain an End node.`)

    const nodeIdByOriginalId = new Map(component.nodes.filter(node => node.type !== "subflow_start" && node.type !== "subflow_end").map(node => [node.id, `${subflowNode.id}:${node.id}`]),)

    const returnNodeId = `${subflowNode.id}:return`
    const resolveSubflowDestination = (destinationNodeId: string) => {
        if (endNodeIds.has(destinationNodeId)) return returnNodeId

        const destination = nodeIdByOriginalId.get(destinationNodeId)
        if (!destination) throw new Error(`Subflow ${component.name} contains an edge to unknown node ${destinationNodeId}.`)
        return destination
    }

    const entryNodeId = resolveSubflowDestination(startNode.edge.destination_node_id)
    const nodes = component.nodes
        .filter(node => node.type !== "subflow_start" && node.type !== "subflow_end")
        .map(node => ({ ...withResolvedDestinations(node, resolveSubflowDestination), id: nodeIdByOriginalId.get(node.id)!, }) as FlowNode)

    return {
        entryNodeId,
        nodes,
        returnNode: {
            id: returnNodeId,
            type: "conversation",
            name: `${subflowNode.name} complete`,
            skippable: false,
            display_position: subflowNode.display_position,
            start_speaker: "agent",
            instruction: {
                type: "static_text",
                text: "The subflow has completed. Continue with the caller using the available transitions.",
            },
            edges: subflowNode.edges ?? [],
        },
    }
}

function withResolvedDestinations(node: FlowNode, resolveDestination: (destinationNodeId: string) => string): FlowNode {
    const resolveEdge = (edge: CF["Edge"]): CF["Edge"] => edge.destination_node_id
        ? { ...edge, destination_node_id: resolveDestination(edge.destination_node_id) }
        : edge

    return {
        ...node,
        ...("edges" in node ? { edges: node.edges?.map(resolveEdge) } : {}),
        ...("edge" in node ? { edge: resolveEdge(node.edge) } : {}),
        ...("else_edge" in node && node.else_edge ? { else_edge: resolveEdge(node.else_edge) } : {}),
        ...("always_edge" in node && node.always_edge ? { always_edge: resolveEdge(node.always_edge) } : {}),
        ...("success_edge" in node ? { success_edge: resolveEdge(node.success_edge) } : {}),
        ...("failed_edge" in node ? { failed_edge: resolveEdge(node.failed_edge) } : {}),
    } as FlowNode
}
