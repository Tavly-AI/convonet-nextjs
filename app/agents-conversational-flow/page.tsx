"use client"

import { Background, BackgroundVariant, ReactFlow, ReactFlowProvider, useNodesState, useReactFlow, type Connection, type Edge } from "@xyflow/react"
import { FlowLeftSidePanel } from "./_components/panels/flow-left-side-panel"
import { FlowRightSidePanel } from "./_components/panels/flow-right-side-panel"
import { FlowConversationNodeType } from "./_components/node-cf-components/ConversationFlowNode"
import { FlowSubAgentsNodeType } from "./_components/node-cf-components/SubAgentsFlowNode"
import { createCFNode } from "./_lib/flow-node-factory"
import { FlowBeginNodeType } from "./_components/node-cf-components/BeginFlowNode"
import { CallTransferFlowNode } from "./_components/node-cf-components/CallTransferFlowNode"
import { PressDigitFlowNode } from "./_components/node-cf-components/PressDigitFlowNode"
import { LogicSplitFlowNode } from "./_components/node-cf-components/LogicSplitFlowNode"
import { AgentTransferFlowNode } from "./_components/node-cf-components/AgentTransferFlowNode"
import { SmsFlowNode } from "./_components/node-cf-components/SmsFlowNode"
import { CodeFlowNode } from "./_components/node-cf-components/CodeFlowNode"
import { EndFlowNode } from "./_components/node-cf-components/EndFlowNode"
import { useEffect } from "react"
import type { CF } from "./_types/global-cf-types"
import { conversational_flow_session_storage } from "./_lib/flow-sessionStorage"


type FlowNode = CF["Node"]

const initialNodes: FlowNode[] = []

const nodeTypes = {
    begin: FlowBeginNodeType,
    conversation: FlowConversationNodeType,
    subagent: FlowSubAgentsNodeType,
    transfer_call: CallTransferFlowNode,
    press_digit: PressDigitFlowNode,
    branch: LogicSplitFlowNode,
    agent_swap: AgentTransferFlowNode,
    sms: SmsFlowNode,
    code: CodeFlowNode,
    end: EndFlowNode,
}

function getEdges(data: CF["Node"]["data"]): CF["Edge"][] {
    return [
        ...("edges" in data ? data.edges ?? [] : []),
        ...("edge" in data ? [data.edge] : []),
        ...("else_edge" in data && data.else_edge ? [data.else_edge] : []),
        ...("always_edge" in data && data.always_edge ? [data.always_edge] : []),
        ...("success_edge" in data ? [data.success_edge] : []),
        ...("failed_edge" in data ? [data.failed_edge] : []),
    ]
}

function setDestination(
    node: CF["Node"],
    edgeId: string,
    destination_node_id: string
): CF["Node"] {
    const update = (edge: CF["Edge"]) => edge.id === edgeId ? { ...edge, destination_node_id } : edge
    const data = node.data
    return {
        ...node,
        data: {
            ...data,
            ...("edges" in data && { edges: data.edges?.map(update) }),
            ...("edge" in data && { edge: update(data.edge) }),
            ...("else_edge" in data && data.else_edge ? { else_edge: update(data.else_edge) } : {}),
            ...("always_edge" in data && data.always_edge ? { always_edge: update(data.always_edge) } : {}),
            ...("success_edge" in data && { success_edge: update(data.success_edge) }),
            ...("failed_edge" in data && { failed_edge: update(data.failed_edge) }),
        },
    } as CF["Node"]

}

function FlowCanvas() {
    const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(initialNodes)
    const { screenToFlowPosition } = useReactFlow()

    const edges: Edge[] = nodes.flatMap(node =>
        getEdges(node.data)
            .filter((edge) => edge.destination_node_id)
            .map(edge => ({ id: edge.id, source: node.id, sourceHandle: edge.id, target: edge.destination_node_id!, type: "smoothstep" }))
    )


    function onDrop(e: React.DragEvent) {
        e.preventDefault()

        const type = e.dataTransfer.getData("application/reactflow") as CF["Type"]
        if (!type) return

        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
        const data = createCFNode(type, position)

        conversational_flow_session_storage.set(data)

        setNodes(nodes => [...nodes, { id: data.id, type, position, data } as CF["Node"],])
    }


    function onConnect({ source, sourceHandle, target }: Connection) {
        if (!source || !sourceHandle || !target) return

        const sourceNode = nodes.find(node => node.id === source)
        if (!sourceNode) return

        const data = conversational_flow_session_storage.get(sourceNode.type, sourceNode.id) ?? sourceNode.data
        const updatedNode = setDestination({ ...sourceNode, data } as CF["Node"], sourceHandle, target)
        conversational_flow_session_storage.set(updatedNode.data)
        setNodes(current => current.map(node => node.id === source ? updatedNode : node))
    }

    useEffect(() => {
        const flowNodes = nodes.map(node => ({
            ...node.data,
            display_position: node.position,
        }))

        console.log(
            "nodes:",
            JSON.stringify(flowNodes, null, 2)
        )
    }, [nodes])

    return (
        <div className="size-full">
            <FlowLeftSidePanel />
            <FlowRightSidePanel />
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = "move"
                }}
                fitView
                className="bg-zinc-950"
            >
                <Background variant={BackgroundVariant.Dots} color="#52525b" gap={22} size={1.25} />
            </ReactFlow>
        </div>
    )
}

export default function ConversationalFlowPage() {
    return (
        <main className="min-h-svh bg-zinc-950">
            <section className="h-screen w-full">
                <ReactFlowProvider>
                    <FlowCanvas />
                </ReactFlowProvider>
            </section>
        </main>
    )
}
